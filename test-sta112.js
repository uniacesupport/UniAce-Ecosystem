import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function checkSTA112() {
  const snapshot = await getDocs(collection(db, 'courses'));
  const courses = [];
  snapshot.forEach(doc => {
    if (doc.id === 'STA112') {
      courses.push(doc.data());
    }
  });
  console.log(JSON.stringify(courses, null, 2));
}

checkSTA112().catch(console.error);
