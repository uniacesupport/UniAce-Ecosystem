import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize app
const app = initializeApp(firebaseConfig);

// Export auth and db
export const auth = getAuth(app);
export const storage = getStorage(app);

// Initialize Firestore with optional database ID
export const db = firebaseConfig.firestoreDatabaseId && 
                  firebaseConfig.firestoreDatabaseId !== "(default)" && 
                  firebaseConfig.firestoreDatabaseId !== firebaseConfig.projectId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Connection test
async function testConnection() {
  console.log("Testing Firestore connection for project:", firebaseConfig.projectId);
  try {
    const testDoc = await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection test successful. Doc exists:", testDoc.exists());
  } catch (error: any) {
    console.error("Firestore connection test failed:", error.code, error.message);
  }
}
testConnection();

// Messaging (FCM) - only if supported in browser
export const messaging = async () => {
  const supported = await isSupported();
  return supported ? getMessaging(app) : null;
};
