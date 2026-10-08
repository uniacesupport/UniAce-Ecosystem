
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';

dotenv.config();

const currentFilename = typeof __filename !== 'undefined' ? __filename : path.join(process.cwd(), 'server', 'firebaseAdmin.ts');
const currentDirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(currentFilename);

let adminApp: admin.app.App | null = null;
let db: admin.firestore.Firestore | null = null;

// --- Persistent Write-Through Overlay & Quota Circuit Breaker ---
const OVERLAY_FILE_PATH = path.join(process.cwd(), '.firestore-overlay.json');
const memoryOverlay = new Map<string, Record<string, any>>();
const deletedDocs = new Set<string>();
let writeQuotaExhaustedUntil = 0;
let overlaySaveTimer: NodeJS.Timeout | null = null;

function serializeOverlayValue(val: any): any {
  if (val && typeof val === 'object') {
    if (typeof val.toDate === 'function') {
      try {
        return { __isTimestamp: true, iso: val.toDate().toISOString() };
      } catch {
        return { __isTimestamp: true, iso: new Date().toISOString() };
      }
    }
    if (Array.isArray(val)) {
      return val.map(serializeOverlayValue);
    }
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (typeof v !== 'function' && v !== undefined) {
        out[k] = serializeOverlayValue(v);
      }
    }
    return out;
  }
  return val;
}

function deserializeOverlayValue(val: any): any {
  if (val && typeof val === 'object') {
    if (val.__isTimestamp && typeof val.iso === 'string') {
      const d = new Date(val.iso);
      return {
        __isTimestamp: true,
        iso: val.iso,
        toDate: () => d,
        toMillis: () => d.getTime(),
        toISOString: () => d.toISOString()
      };
    }
    if (Array.isArray(val)) {
      return val.map(deserializeOverlayValue);
    }
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      out[k] = deserializeOverlayValue(v);
    }
    return out;
  }
  return val;
}

function loadOverlayFromDisk() {
  try {
    if (fs.existsSync(OVERLAY_FILE_PATH)) {
      const raw = JSON.parse(fs.readFileSync(OVERLAY_FILE_PATH, 'utf8'));
      if (raw && typeof raw.docs === 'object' && raw.docs !== null) {
        for (const [docPath, docData] of Object.entries(raw.docs)) {
          if (docData && typeof docData === 'object') {
            memoryOverlay.set(docPath, deserializeOverlayValue(docData));
          }
        }
      }
      if (raw && Array.isArray(raw.deleted)) {
        for (const p of raw.deleted) {
          if (typeof p === 'string') deletedDocs.add(p);
        }
      }
    }
  } catch (err) {
    console.warn('Could not load Firestore overlay cache from disk:', err);
  }
}

function flushOverlayToDisk() {
  try {
    const docsObj: Record<string, any> = {};
    for (const [docPath, docData] of memoryOverlay.entries()) {
      docsObj[docPath] = serializeOverlayValue(docData);
    }
    const payload = JSON.stringify({
      updatedAt: new Date().toISOString(),
      docs: docsObj,
      deleted: Array.from(deletedDocs)
    });
    fs.writeFileSync(OVERLAY_FILE_PATH, payload, 'utf8');
  } catch (err) {
    console.warn('Could not persist Firestore overlay cache to disk:', err);
  }
}

function scheduleOverlayDiskSave() {
  if (overlaySaveTimer) clearTimeout(overlaySaveTimer);
  overlaySaveTimer = setTimeout(() => {
    overlaySaveTimer = null;
    flushOverlayToDisk();
  }, 150);
}

loadOverlayFromDisk();

function isQuotaError(err: any): boolean {
  if (!err) return false;
  const code = err.code ?? err.status;
  const msg = String(err.message || err || '').toLowerCase();
  return (
    code === 8 ||
    code === 'resource-exhausted' ||
    code === 'RESOURCE_EXHAUSTED' ||
    msg.includes('resource-exhausted') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota') ||
    msg.includes('write_timeout')
  );
}

function applyFieldValueTransform(currentVal: any, incomingVal: any): any {
  if (incomingVal && typeof incomingVal === 'object') {
    const constructorName = incomingVal.constructor?.name || '';
    if (constructorName.includes('NumericIncrementTransform') || typeof incomingVal.operand === 'number') {
      const base = typeof currentVal === 'number' ? currentVal : 0;
      return base + Number(incomingVal.operand || 0);
    }
    if (constructorName.includes('ServerTimestampTransform')) {
      return {
        toDate: () => new Date(),
        toMillis: () => Date.now(),
        toISOString: () => new Date().toISOString()
      };
    }
    if (constructorName.includes('ArrayUnionTransform') && Array.isArray(incomingVal.elements)) {
      const base = Array.isArray(currentVal) ? [...currentVal] : [];
      for (const el of incomingVal.elements) {
        if (!base.includes(el)) base.push(el);
      }
      return base;
    }
    if (constructorName.includes('ArrayRemoveTransform') && Array.isArray(incomingVal.elements)) {
      const base = Array.isArray(currentVal) ? [...currentVal] : [];
      return base.filter(item => !incomingVal.elements.includes(item));
    }
    if (constructorName.includes('DeleteTransform')) {
      return undefined;
    }
  }
  return incomingVal;
}

function applyOverlayWrite(docPath: string, data: Record<string, any>, merge: boolean) {
  if (!docPath || !data || typeof data !== 'object') return;
  deletedDocs.delete(docPath);
  const existing = merge ? { ...(memoryOverlay.get(docPath) || {}) } : {};

  for (const [k, v] of Object.entries(data)) {
    if (k.includes('.')) {
      const parts = k.split('.');
      let cursor: any = existing;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!cursor[part] || typeof cursor[part] !== 'object') {
          cursor[part] = {};
        } else {
          cursor[part] = { ...cursor[part] };
        }
        cursor = cursor[part];
      }
      const lastKey = parts[parts.length - 1];
      const transformed = applyFieldValueTransform(cursor[lastKey], v);
      if (transformed === undefined) {
        delete cursor[lastKey];
      } else {
        cursor[lastKey] = transformed;
      }
    } else {
      const transformed = applyFieldValueTransform(existing[k], v);
      if (transformed === undefined) {
        delete existing[k];
      } else {
        existing[k] = transformed;
      }
    }
  }
  memoryOverlay.set(docPath, existing);
  scheduleOverlayDiskSave();
}

function wrapDocSnapshot(docRef: any, rawSnap: any): any {
  const docPath = docRef?.path || rawSnap?.ref?.path || '';
  if (deletedDocs.has(docPath)) {
    return {
      exists: false,
      id: docRef?.id || rawSnap?.id || docPath.split('/').pop() || '',
      ref: docRef || rawSnap?.ref,
      data: () => undefined,
      get: () => undefined
    };
  }
  const overlay = memoryOverlay.get(docPath);
  const rawExists = Boolean(rawSnap && (typeof rawSnap.exists === 'function' ? rawSnap.exists() : rawSnap.exists));
  const rawData = rawExists && typeof rawSnap.data === 'function' ? rawSnap.data() : undefined;

  if (!overlay) {
    if (rawSnap) return rawSnap;
    return {
      exists: false,
      id: docRef?.id || docPath.split('/').pop() || '',
      ref: docRef,
      data: () => undefined,
      get: () => undefined
    };
  }

  const merged = { ...(rawData || {}), ...overlay };
  return {
    exists: true,
    id: docRef?.id || rawSnap?.id || docPath.split('/').pop() || '',
    ref: docRef || rawSnap?.ref,
    data: () => merged,
    get: (field: string) => merged[field]
  };
}

function installFirestoreQuotaShield(firestoreInstance: admin.firestore.Firestore) {
  try {
    const sampleCollection = firestoreInstance.collection('__shield_init__');
    const sampleDoc = sampleCollection.doc('__shield_doc__');
    const sampleBatch = firestoreInstance.batch();

    const docProto = Object.getPrototypeOf(sampleDoc);
    const colProto = Object.getPrototypeOf(sampleCollection);
    const queryProto = Object.getPrototypeOf(Object.getPrototypeOf(sampleCollection));
    const batchProto = Object.getPrototypeOf(sampleBatch);
    const dbProto = Object.getPrototypeOf(firestoreInstance);

    if ((docProto as any).__quotaShieldInstalled) return;
    (docProto as any).__quotaShieldInstalled = true;

    const origDocGet = docProto.get;
    const origDocSet = docProto.set;
    const origDocUpdate = docProto.update;
    const origDocDelete = docProto.delete;

    const origColAdd = colProto.add;
    const origQueryGet = queryProto.get || colProto.get;

    const origBatchSet = batchProto.set;
    const origBatchUpdate = batchProto.update;
    const origBatchDelete = batchProto.delete;
    const origBatchCommit = batchProto.commit;

    const origRunTransaction = dbProto.runTransaction;

    const runWithWriteShield = async <T>(op: () => Promise<T>, fallbackVal: T): Promise<T> => {
      if (Date.now() < writeQuotaExhaustedUntil) {
        return fallbackVal;
      }
      let timer: NodeJS.Timeout | null = null;
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error('WRITE_TIMEOUT_QUOTA_SHIELD')), 2000);
        });
        return await Promise.race([op(), timeoutPromise]);
      } catch (err: any) {
        if (isQuotaError(err)) {
          if (Date.now() >= writeQuotaExhaustedUntil) {
            console.warn('[Firestore Quota Shield] Daily write quota exhausted — activating in-memory write-through overlay for 10m.');
          }
          writeQuotaExhaustedUntil = Date.now() + 10 * 60 * 1000;
          return fallbackVal;
        }
        throw err;
      } finally {
        if (timer) clearTimeout(timer);
      }
    };

    docProto.get = async function (...args: any[]) {
      let rawSnap: any = null;
      try {
        rawSnap = await origDocGet.apply(this, args);
      } catch (err: any) {
        if (!isQuotaError(err)) throw err;
      }
      return wrapDocSnapshot(this, rawSnap);
    };

    docProto.set = async function (data: any, options?: any) {
      const merge = Boolean(options && (options.merge || options.mergeFields));
      applyOverlayWrite(this.path, data, merge);
      return runWithWriteShield(() => origDocSet.call(this, data, options), { writeTime: new Date() } as any);
    };

    docProto.update = async function (dataOrField: any, ...rest: any[]) {
      let updateObj: Record<string, any> = {};
      if (typeof dataOrField === 'string') {
        updateObj[dataOrField] = rest[0];
        for (let i = 1; i < rest.length; i += 2) {
          if (typeof rest[i] === 'string') updateObj[rest[i]] = rest[i + 1];
        }
      } else if (dataOrField && typeof dataOrField === 'object') {
        updateObj = dataOrField;
      }
      applyOverlayWrite(this.path, updateObj, true);
      return runWithWriteShield(() => origDocUpdate.call(this, dataOrField, ...rest), { writeTime: new Date() } as any);
    };

    docProto.delete = async function (...args: any[]) {
      memoryOverlay.delete(this.path);
      deletedDocs.add(this.path);
      return runWithWriteShield(() => origDocDelete.apply(this, args), { writeTime: new Date() } as any);
    };

    colProto.add = async function (data: any) {
      const newDocRef = this.doc(crypto.randomBytes(10).toString('hex'));
      applyOverlayWrite(newDocRef.path, data, false);
      await runWithWriteShield(() => origDocSet.call(newDocRef, data), { writeTime: new Date() } as any);
      return newDocRef;
    };

    const patchedQueryGet = async function (this: any, ...args: any[]) {
      let rawQuerySnap: any = null;
      try {
        rawQuerySnap = await origQueryGet.apply(this, args);
      } catch (err: any) {
        if (!isQuotaError(err)) throw err;
      }

      const colPath: string | undefined = this.path;
      const existingDocs: any[] = rawQuerySnap?.docs ? [...rawQuerySnap.docs] : [];
      const seenPaths = new Set<string>();
      const mergedDocs: any[] = [];

      for (const d of existingDocs) {
        const p = d.ref?.path || (colPath ? `${colPath}/${d.id}` : d.id);
        seenPaths.add(p);
        if (deletedDocs.has(p)) continue;
        mergedDocs.push(wrapDocSnapshot(d.ref, d));
      }

      if (colPath) {
        const prefix = `${colPath}/`;
        for (const [overPath, overData] of memoryOverlay.entries()) {
          if (overPath.startsWith(prefix) && !seenPaths.has(overPath) && !deletedDocs.has(overPath)) {
            const remainder = overPath.slice(prefix.length);
            if (!remainder.includes('/')) {
              const syntheticRef = this.doc ? this.doc(remainder) : { id: remainder, path: overPath };
              mergedDocs.push(wrapDocSnapshot(syntheticRef, null));
            }
          }
        }
      }

      return {
        empty: mergedDocs.length === 0,
        size: mergedDocs.length,
        docs: mergedDocs,
        forEach: (cb: (doc: any) => void) => mergedDocs.forEach(cb)
      };
    };

    if (queryProto && queryProto.get) {
      queryProto.get = patchedQueryGet;
    }
    colProto.get = patchedQueryGet;

    batchProto.set = function (docRef: any, data: any, options?: any) {
      if (!this.__overlayOps) this.__overlayOps = [];
      this.__overlayOps.push(() => applyOverlayWrite(docRef.path, data, Boolean(options && (options.merge || options.mergeFields))));
      return origBatchSet.call(this, docRef, data, options);
    };

    batchProto.update = function (docRef: any, dataOrField: any, ...rest: any[]) {
      if (!this.__overlayOps) this.__overlayOps = [];
      this.__overlayOps.push(() => {
        const obj = typeof dataOrField === 'string' ? { [dataOrField]: rest[0] } : dataOrField;
        applyOverlayWrite(docRef.path, obj, true);
      });
      return origBatchUpdate.call(this, docRef, dataOrField, ...rest);
    };

    batchProto.delete = function (docRef: any, ...rest: any[]) {
      if (!this.__overlayOps) this.__overlayOps = [];
      this.__overlayOps.push(() => {
        memoryOverlay.delete(docRef.path);
        deletedDocs.add(docRef.path);
      });
      return origBatchDelete.call(this, docRef, ...rest);
    };

    batchProto.commit = async function (...args: any[]) {
      if (Array.isArray(this.__overlayOps)) {
        for (const fn of this.__overlayOps) fn();
      }
      return runWithWriteShield(() => origBatchCommit.apply(this, args), []);
    };

    dbProto.runTransaction = async function (updateFunction: (t: any) => Promise<any>, transactionOptions?: any) {
      const runFallbackTransaction = async () => {
        const fallbackTx = {
          get: async (refOrQuery: any) => refOrQuery.get(),
          set: (docRef: any, data: any, options?: any) => {
            applyOverlayWrite(docRef.path, data, Boolean(options && (options.merge || options.mergeFields)));
            return fallbackTx;
          },
          update: (docRef: any, dataOrField: any, ...rest: any[]) => {
            const obj = typeof dataOrField === 'string' ? { [dataOrField]: rest[0] } : dataOrField;
            applyOverlayWrite(docRef.path, obj, true);
            return fallbackTx;
          },
          delete: (docRef: any) => {
            memoryOverlay.delete(docRef.path);
            deletedDocs.add(docRef.path);
            return fallbackTx;
          }
        };
        return await updateFunction(fallbackTx);
      };

      if (Date.now() < writeQuotaExhaustedUntil) {
        return await runFallbackTransaction();
      }

      let timer: NodeJS.Timeout | null = null;
      try {
        const txPromise = origRunTransaction.call(this, async (nativeTx: any) => {
          const wrappedTx = {
            get: async (refOrQuery: any) => {
              const raw = await nativeTx.get(refOrQuery);
              return refOrQuery?.path && !refOrQuery.where ? wrapDocSnapshot(refOrQuery, raw) : raw;
            },
            set: (docRef: any, data: any, options?: any) => {
              applyOverlayWrite(docRef.path, data, Boolean(options && (options.merge || options.mergeFields)));
              nativeTx.set(docRef, data, options);
              return wrappedTx;
            },
            update: (docRef: any, dataOrField: any, ...rest: any[]) => {
              const obj = typeof dataOrField === 'string' ? { [dataOrField]: rest[0] } : dataOrField;
              applyOverlayWrite(docRef.path, obj, true);
              nativeTx.update(docRef, dataOrField, ...rest);
              return wrappedTx;
            },
            delete: (docRef: any) => {
              memoryOverlay.delete(docRef.path);
              deletedDocs.add(docRef.path);
              nativeTx.delete(docRef);
              return wrappedTx;
            }
          };
          return await updateFunction(wrappedTx);
        }, { maxAttempts: 1, ...(transactionOptions || {}) });

        const timeoutPromise = new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error('WRITE_TIMEOUT_QUOTA_SHIELD')), 2500);
        });

        return await Promise.race([txPromise, timeoutPromise]);
      } catch (err: any) {
        if (isQuotaError(err)) {
          if (Date.now() >= writeQuotaExhaustedUntil) {
            console.warn('[Firestore Quota Shield] Transaction hit write quota limit — falling back to in-memory write-through transaction for 10m.');
          }
          writeQuotaExhaustedUntil = Date.now() + 10 * 60 * 1000;
          return await runFallbackTransaction();
        }
        throw err;
      } finally {
        if (timer) clearTimeout(timer);
      }
    };
  } catch (shieldErr) {
    console.warn('Could not install Firestore quota shield:', shieldErr);
  }
}

try {
  let serviceAccount;
  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT?.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
  
  if (serviceAccountStr) {
    serviceAccount = JSON.parse(serviceAccountStr);
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    let databaseId = '(default)';
    try {
      // Look for config in the root directory
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.firestoreDatabaseId) {
          databaseId = config.firestoreDatabaseId;
        }
      }
    } catch (e) {
      console.warn('Could not read firebase-applet-config.json', e);
    }
    
    db = getFirestore(adminApp, databaseId);
    db.settings({ ignoreUndefinedProperties: true });
    installFirestoreQuotaShield(db);
    
    // Override app.firestore() and admin.firestore() to return the correct named db instance
    adminApp.firestore = () => db as admin.firestore.Firestore;
    try {
      (admin as any).firestore = Object.assign(() => db as admin.firestore.Firestore, admin.firestore);
    } catch {
      // Ignore if read-only property on namespace
    }
    
    console.log(`Firebase Admin Initialized Successfully with database: ${databaseId}`);
  } else {
    console.warn("FIREBASE_SERVICE_ACCOUNT is missing. Firebase Admin features will be disabled.");
  }
} catch (error) {
  console.error("CRITICAL: Failed to initialize Firebase Admin.", error);
}

export const isFirebaseInitialized = (): boolean => {
  return !!adminApp;
};

export const getAdminApp = (): admin.app.App | null => {
  return adminApp;
};

export const getDb = (): admin.firestore.Firestore | null => {
  return db;
};
