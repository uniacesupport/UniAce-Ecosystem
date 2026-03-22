import { db, auth } from '../firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

export interface SRSRecord {
  userId: string;
  topicId: string;
  courseId: string;
  easinessFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string;
  lastReviewed: string;
  topicTitle: string;
}

export const SRSService = {
  /**
   * Calculates the next review date based on the SM-2 algorithm.
   * @param quality Score from 0 (blackout) to 5 (perfect response)
   * @param currentRecord The existing SRS record (if any)
   */
  calculateNextReview(quality: number, currentRecord?: SRSRecord): Partial<SRSRecord> {
    let { easinessFactor = 2.5, interval = 0, repetitions = 0 } = currentRecord || {};

    if (quality >= 3) {
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easinessFactor);
      }
      repetitions += 1;
    } else {
      repetitions = 0;
      interval = 1;
    }

    easinessFactor = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easinessFactor < 1.3) easinessFactor = 1.3;

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    return {
      easinessFactor,
      interval,
      repetitions,
      nextReviewDate: nextReviewDate.toISOString(),
      lastReviewed: new Date().toISOString()
    };
  },

  /**
   * Updates or creates an SRS record for a specific topic/lesson after a quiz.
   */
  async updateSRS(courseId: string, topicId: string, topicTitle: string, scorePercentage: number) {
    const user = auth.currentUser;
    if (!user) return;

    // Convert score percentage (0-100) to SM-2 quality (0-5)
    let quality = 0;
    if (scorePercentage >= 95) quality = 5;
    else if (scorePercentage >= 80) quality = 4;
    else if (scorePercentage >= 60) quality = 3;
    else if (scorePercentage >= 40) quality = 2;
    else if (scorePercentage >= 20) quality = 1;

    const srsRef = doc(db, `users/${user.uid}/spaced_repetition`, topicId);
    const srsSnap = await getDoc(srsRef);
    
    let currentRecord: SRSRecord | undefined;
    if (srsSnap.exists()) {
      currentRecord = srsSnap.data() as SRSRecord;
    }

    const updates = this.calculateNextReview(quality, currentRecord);

    const fullRecord: SRSRecord = {
      userId: user.uid,
      topicId,
      courseId,
      topicTitle,
      easinessFactor: updates.easinessFactor!,
      interval: updates.interval!,
      repetitions: updates.repetitions!,
      nextReviewDate: updates.nextReviewDate!,
      lastReviewed: updates.lastReviewed!
    };

    await setDoc(srsRef, fullRecord, { merge: true });
  },

  /**
   * Fetches all topics that are currently due for review.
   */
  async getDueReviews(): Promise<SRSRecord[]> {
    const user = auth.currentUser;
    if (!user) return [];

    const now = new Date().toISOString();
    const srsRef = collection(db, `users/${user.uid}/spaced_repetition`);
    
    // Query for items where nextReviewDate is in the past
    const q = query(srsRef, where("nextReviewDate", "<=", now));
    const querySnapshot = await getDocs(q);
    
    const dueItems: SRSRecord[] = [];
    querySnapshot.forEach((doc) => {
      dueItems.push(doc.data() as SRSRecord);
    });

    return dueItems;
  }
};
