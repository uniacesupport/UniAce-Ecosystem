
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let adminApp: admin.app.App | null = null;
let db: admin.firestore.Firestore | null = null;

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
    
    // Override app.firestore() to return the correct db instance
    adminApp.firestore = () => db as admin.firestore.Firestore;
    
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

export const getAdminApp = (): admin.app.App => {
  if (!adminApp) {
    throw new Error("Firebase Admin App is not initialized. Please check your FIREBASE_SERVICE_ACCOUNT environment variable.");
  }
  return adminApp;
};

export const getDb = (): admin.firestore.Firestore => {
  if (!db) {
    throw new Error("Firestore database is not initialized. Please check your Firebase configuration.");
  }
  return db;
};
