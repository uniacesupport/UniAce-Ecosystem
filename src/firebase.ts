import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize app
const app = initializeApp(firebaseConfig);

// Export auth and db
export const auth = getAuth(app);
export const storage = getStorage(app);

// Initialize Firestore with offline caching to save quota!
const firestoreSettings = {
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
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
