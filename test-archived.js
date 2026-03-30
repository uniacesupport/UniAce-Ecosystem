import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function checkArchived() {
  const snapshot = await getDocs(collection(db, 'archived_courses'));
  snapshot.forEach(d => {
    console.log(`Archived: ${d.id}`);
  });
}

checkArchived().catch(console.error);
