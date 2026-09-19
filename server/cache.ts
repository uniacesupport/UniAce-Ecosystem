
import { getAdminApp } from './firebaseAdmin';
import crypto from 'crypto';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// High-speed in-memory store for Node server
const memoryStore = new Map<string, CacheEntry<any>>();

// Maximum entries in memory store to prevent memory leaks
const MAX_CACHE_ENTRIES = 5000;

export function getMemoryCache<T>(key: string): T | null {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setMemoryCache<T>(key: string, data: T, ttlMs: number = 60 * 1000): void {
  if (memoryStore.size >= MAX_CACHE_ENTRIES) {
    // Evict oldest 10%
    let count = 0;
    for (const k of memoryStore.keys()) {
      memoryStore.delete(k);
      count++;
      if (count > MAX_CACHE_ENTRIES * 0.1) break;
    }
  }
  memoryStore.set(key, {
    data,
    expiresAt: Date.now() + ttlMs
  });
}

export function invalidateMemoryCache(prefixOrKey?: string): void {
  if (!prefixOrKey) {
    memoryStore.clear();
    return;
  }
  for (const k of memoryStore.keys()) {
    if (k.startsWith(prefixOrKey) || k === prefixOrKey) {
      memoryStore.delete(k);
    }
  }
}

/**
 * Cached getter for system_config documents (routing, ai_mode, pricing, etc.)
 * Avoids burning 10,000s of Firestore reads on repetitive config queries.
 */
export async function getCachedSystemConfig(configKey: string, ttlMs: number = 5 * 60 * 1000): Promise<any> {
  const cacheKey = `sys_config:${configKey}`;
  const cached = getMemoryCache<any>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  const app = getAdminApp();
  if (!app) return null;

  try {
    const doc = await app.firestore().collection('system_config').doc(configKey).get();
    if (doc.exists) {
      const data = doc.data();
      setMemoryCache(cacheKey, data, ttlMs);
      return data;
    }
    // Cache negative result briefly (30s) to avoid hammer
    setMemoryCache(cacheKey, null, 30 * 1000);
    return null;
  } catch (error) {
    console.warn(`[Cache] Error reading system_config/${configKey}:`, error);
    return null;
  }
}

export async function getCachedResponse(question: string): Promise<string | null> {
  const normalized = question.toLowerCase().trim();
  const hash = crypto.createHash('sha256').update(normalized).digest('hex');
  const memKey = `q_cache:${hash}`;

  // 1. In-memory check (0 Firestore reads, <0.1ms)
  const memHit = getMemoryCache<string>(memKey);
  if (memHit) {
    return memHit;
  }

  const app = getAdminApp();
  if (!app) return null;

  try {
    const doc = await app.firestore().collection('question_cache').doc(hash).get();
    if (doc.exists) {
      const answer = doc.data()?.answer || null;
      if (answer) {
        // Cache in memory for 1 hour
        setMemoryCache(memKey, answer, 60 * 60 * 1000);
      }
      return answer;
    }
  } catch (error) {
    console.error('Cache lookup error:', error);
  }
  return null;
}

export async function setCachedResponse(question: string, answer: string): Promise<void> {
  const normalized = question.toLowerCase().trim();
  const hash = crypto.createHash('sha256').update(normalized).digest('hex');
  const memKey = `q_cache:${hash}`;

  // 1. Immediately cache in memory for 1 hour
  setMemoryCache(memKey, answer, 60 * 60 * 1000);

  const app = getAdminApp();
  if (!app) return;

  try {
    // 2. Persist to Firestore asynchronously
    await app.firestore().collection('question_cache').doc(hash).set({
      question: normalized,
      answer,
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Cache save error:', error);
  }
}

