import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, memoryLocalCache, setLogLevel } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";
import firebaseConfig from "../firebase-applet-config.json";

// Suppress internal @firebase/firestore WebChannel backoff/quota console.error spam
try {
  setLogLevel('silent');
} catch {
  // Ignore if unsupported
}

// Initialize app
const app = initializeApp(firebaseConfig);

// Export auth and db
export const auth = getAuth(app);
export const storage = getStorage(app);

// Use memoryLocalCache so stale pending writes in IndexedDB are not endlessly replayed when daily write quota is exhausted
const firestoreSettings = {
  localCache: memoryLocalCache()
};

export const db = firebaseConfig.firestoreDatabaseId && 
                  firebaseConfig.firestoreDatabaseId !== "(default)" && 
                  firebaseConfig.firestoreDatabaseId !== firebaseConfig.projectId
  ? initializeFirestore(app, firestoreSettings, firebaseConfig.firestoreDatabaseId)
  : initializeFirestore(app, firestoreSettings);

// Messaging (FCM) - only if supported in browser
export const messaging = async () => {
  const supported = await isSupported();
  return supported ? getMessaging(app) : null;
};
