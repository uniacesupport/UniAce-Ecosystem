
import { getAdminApp } from './firebaseAdmin';
import crypto from 'crypto';

export async function getCachedResponse(question: string): Promise<string | null> {
  console.log('Cache lookup start for:', question);
  const hash = crypto.createHash('sha256').update(question.toLowerCase().trim()).digest('hex');
  const app = getAdminApp();
  if (!app) {
    console.log('Cache lookup: No app instance');
    return null;
  }

  try {
    console.log('Cache lookup: Fetching doc', hash);
    const doc = await app.firestore().collection('question_cache').doc(hash).get();
    if (doc.exists) {
      console.log('Cache hit');
      return doc.data()?.answer || null;
    }
    console.log('Cache miss');
  } catch (error) {
    console.error('Cache lookup error:', error);
  }
  return null;
}

export async function setCachedResponse(question: string, answer: string): Promise<void> {
  console.log('Cache save start for:', question);
  const hash = crypto.createHash('sha256').update(question.toLowerCase().trim()).digest('hex');
  const app = getAdminApp();
  if (!app) {
    console.log('Cache save: No app instance');
    return;
  }

  try {
    console.log('Cache save: Setting doc', hash);
    await app.firestore().collection('question_cache').doc(hash).set({
      question: question.toLowerCase().trim(),
      answer,
      createdAt: new Date()
    });
    console.log('Cache save successful');
  } catch (error) {
    console.error('Cache save error:', error);
  }
}
