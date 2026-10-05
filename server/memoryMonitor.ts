import fs from 'fs';
import os from 'os';
import v8 from 'v8';
import admin from 'firebase-admin';
import { getAdminApp } from './firebaseAdmin';

export interface LiveMemoryStats {
  timestamp: string;
  rssMB: number;
  heapUsedMB: number;
  heapTotalMB: number;
  heapLimitMB: number;
  availableHeapMB: number;
  externalMB: number;
  arrayBuffersMB: number;
  hostTotalMB: number;
  hostFreeMB: number;
  cgroupCurrentMB: number | null;
  cgroupLimitMB: number | null;
  heapUtilizationPct: number;
  hostUtilizationPct: number;
  effectiveHeadroomRatio: number;
  cpuCount: number;
  loadAvg1m: number;
  uptimeSeconds: number;
  activeCourseJobs: number;
}

export type AuditLogLevel = 'info' | 'warning' | 'error' | 'success';
export type AuditLogCategory = 'user' | 'admin' | 'system' | 'ai';

function readCgroupByteValue(paths: string[]): number | null {
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8').trim();
        if (raw && raw !== 'max') {
          const parsed = parseInt(raw, 10);
          if (!isNaN(parsed) && parsed > 0 && parsed < Number.MAX_SAFE_INTEGER) {
            return parsed;
          }
        }
      }
    } catch {
      // Ignore unreadable cgroup paths
    }
  }
  return null;
}

export function getLiveMemoryTelemetry(activeCourseJobs: number = 0): LiveMemoryStats {
  const memUsage = process.memoryUsage();
  const heapStats = v8.getHeapStatistics();

  const osTotalBytes = os.totalmem();
  const osFreeBytes = os.freemem();

  const cgroupLimitBytes = readCgroupByteValue([
    '/sys/fs/cgroup/memory.max',
    '/sys/fs/cgroup/memory/memory.limit_in_bytes'
  ]);
  const cgroupCurrentBytes = readCgroupByteValue([
    '/sys/fs/cgroup/memory.current',
    '/sys/fs/cgroup/memory/memory.usage_in_bytes'
  ]);

  const effectiveHostTotalBytes =
    cgroupLimitBytes && cgroupLimitBytes < osTotalBytes ? cgroupLimitBytes : osTotalBytes;
  const effectiveHostUsedBytes =
    cgroupCurrentBytes !== null ? cgroupCurrentBytes : Math.max(0, osTotalBytes - osFreeBytes);
  const effectiveHostFreeBytes = Math.max(0, effectiveHostTotalBytes - effectiveHostUsedBytes);

  const toMB = (bytes: number) => Math.round((bytes / (1024 * 1024)) * 100) / 100;

  const rssMB = toMB(memUsage.rss);
  const heapUsedMB = toMB(heapStats.used_heap_size);
  const heapTotalMB = toMB(heapStats.total_heap_size);
  const heapLimitMB = toMB(heapStats.heap_size_limit);
  const availableHeapMB = toMB(Math.max(0, heapStats.heap_size_limit - heapStats.used_heap_size));
  const externalMB = toMB(memUsage.external);
  const arrayBuffersMB = toMB(memUsage.arrayBuffers || 0);
  const hostTotalMB = toMB(effectiveHostTotalBytes);
  const hostFreeMB = toMB(effectiveHostFreeBytes);

  const heapUtilizationPct =
    heapStats.heap_size_limit > 0
      ? Math.round((heapStats.used_heap_size / heapStats.heap_size_limit) * 10000) / 100
      : 0;
  const hostUtilizationPct =
    effectiveHostTotalBytes > 0
      ? Math.round((effectiveHostUsedBytes / effectiveHostTotalBytes) * 10000) / 100
      : 0;

  const heapHeadroom =
    heapStats.heap_size_limit > 0
      ? Math.max(0, (heapStats.heap_size_limit - heapStats.used_heap_size) / heapStats.heap_size_limit)
      : 0;
  const hostHeadroom =
    effectiveHostTotalBytes > 0
      ? Math.max(0, effectiveHostFreeBytes / effectiveHostTotalBytes)
      : heapHeadroom;

  const effectiveHeadroomRatio = Math.round(Math.min(heapHeadroom, hostHeadroom) * 1000) / 1000;
  const loadAvg = os.loadavg();

  return {
    timestamp: new Date().toISOString(),
    rssMB,
    heapUsedMB,
    heapTotalMB,
    heapLimitMB,
    availableHeapMB,
    externalMB,
    arrayBuffersMB,
    hostTotalMB,
    hostFreeMB,
    cgroupCurrentMB: cgroupCurrentBytes !== null ? toMB(cgroupCurrentBytes) : null,
    cgroupLimitMB: cgroupLimitBytes !== null && cgroupLimitBytes < osTotalBytes ? toMB(cgroupLimitBytes) : null,
    heapUtilizationPct,
    hostUtilizationPct,
    effectiveHeadroomRatio,
    cpuCount: Math.max(1, os.cpus()?.length || 1),
    loadAvg1m: Math.round((loadAvg[0] || 0) * 100) / 100,
    uptimeSeconds: Math.round(process.uptime()),
    activeCourseJobs
  };
}

export async function recordBackendSystemLog(
  level: AuditLogLevel,
  category: AuditLogCategory,
  message: string,
  details?: Record<string, any> | null,
  actor?: { uid?: string; email?: string }
): Promise<void> {
  try {
    const app = getAdminApp();
    if (!app) return;
    const db = app.firestore();
    const logRef = db.collection('system_logs').doc();
    let safeDetails: any = null;
    if (details !== undefined && details !== null) {
      try {
        safeDetails = JSON.parse(JSON.stringify(details));
      } catch {
        safeDetails = { info: String(details) };
      }
    }
    await logRef.set({
      id: logRef.id,
      level,
      category,
      message,
      details: safeDetails,
      userId: actor?.uid || 'system',
      userEmail: actor?.email || 'system',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (err: any) {
    console.warn('[SystemAuditLogger] Could not persist system_log entry:', err?.message || err);
  }
}

let memoryMonitorInterval: NodeJS.Timeout | null = null;

export function startMemoryMonitoringUtility(getActiveJobsCount: () => number): NodeJS.Timeout {
  if (memoryMonitorInterval) {
    clearInterval(memoryMonitorInterval);
  }

  const logMemorySnapshot = (isInitial: boolean = false) => {
    const stats = getLiveMemoryTelemetry(getActiveJobsCount());
    const summaryMsg = isInitial
      ? `[MemoryMonitor] Initialized dynamic memory manager — Heap: ${stats.heapUsedMB}/${stats.heapLimitMB} MB (${stats.heapUtilizationPct}%), RSS: ${stats.rssMB} MB, Host Available: ${stats.hostFreeMB}/${stats.hostTotalMB} MB (${stats.hostUtilizationPct}% used), CPUs: ${stats.cpuCount}`
      : `[MemoryMonitor] 1m Telemetry — Heap: ${stats.heapUsedMB}/${stats.heapLimitMB} MB (${stats.heapUtilizationPct}%), RSS: ${stats.rssMB} MB, Host Free: ${stats.hostFreeMB}/${stats.hostTotalMB} MB, Active Jobs: ${stats.activeCourseJobs}, Uptime: ${stats.uptimeSeconds}s`;

    if (stats.heapUtilizationPct >= 85 || stats.hostUtilizationPct >= 90) {
      console.warn(summaryMsg);
      recordBackendSystemLog('warning', 'system', summaryMsg, stats);
    } else {
      console.log(summaryMsg);
      recordBackendSystemLog('info', 'system', summaryMsg, stats);
    }
  };

  // Emit initial startup snapshot once Firebase Admin is ready
  setTimeout(() => logMemorySnapshot(true), 2000);

  // Emit periodic 60-second memory telemetry snapshots
  memoryMonitorInterval = setInterval(() => {
    logMemorySnapshot(false);
  }, 60 * 1000);

  return memoryMonitorInterval;
}
