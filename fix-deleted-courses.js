import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc, deleteField } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function fixDeletedCourses() {
  const snapshot = await getDocs(collection(db, 'courses'));
  const batch = [];
  snapshot.forEach(d => {
    const data = d.data();
    if (data.deleted === true) {
      console.log(`Course ${d.id} is marked as deleted.`);
      batch.push(updateDoc(doc(db, 'courses', d.id), {
        deleted: deleteField(),
        deletedAt: deleteField()
      }));
    }
  });
  
  await Promise.all(batch);
  console.log('Fixed deleted courses.');
}

fixDeletedCourses().catch(console.error);
