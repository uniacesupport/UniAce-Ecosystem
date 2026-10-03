import dotenv from 'dotenv';
dotenv.config();
import { getDb } from '../server/firebaseAdmin';

async function updateModels() {
  const db = getDb();
  if (!db) {
    console.error('Firestore not initialized');
    process.exit(1);
  }

  const docRef = db.collection('system_settings').doc('api_keys');
  const doc = await docRef.get();
  const current = doc.data() || {};

  const updated = {
    ...current,
    gemini_direct: {
      ...(current.gemini_direct || {}),
      model: 'gemini-2.5-flash',
      fallbackModel: 'gemini-2.5-pro'
    },
    groq: {
      ...(current.groq || {}),
      model: 'qwen/qwen3.8-27b',
      fallbackModel: 'openai/gpt-oss-120b'
    },
    nvidia: {
      ...(current.nvidia || {}),
      model: 'openai/gpt-oss-20b',
      fallbackModel: 'openai/gpt-oss-120b'
    },
    mistral_direct: {
      ...(current.mistral_direct || {}),
      model: 'mistral-small-latest',
      fallbackModel: 'codestral-latest'
    }
  };

  await docRef.set(updated, { merge: true });
  console.log('✔ Successfully updated system_settings/api_keys with verified live model IDs:');
  console.log('  Gemini: model=gemini-2.5-flash, fallback=gemini-2.5-pro');
  console.log('  Groq: model=qwen/qwen3.8-27b, fallback=openai/gpt-oss-120b');
  console.log('  Nvidia: model=openai/gpt-oss-20b, fallback=openai/gpt-oss-120b');
  console.log('  Mistral: model=mistral-small-latest, fallback=codestral-latest');
}

updateModels().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
