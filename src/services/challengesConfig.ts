import { db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export interface ArenaChallenge {
  id: string;
  title: string;
  description: string;
  reward: number; // Sparks or XP
  rewardType: 'sparks' | 'xp';
  iconType: 'swords' | 'trophy' | 'flame' | 'target' | 'star' | 'zap';
  targetCount: number;
  category: 'battle' | 'quiz' | 'streak' | 'study';
  active: boolean;
}

export const DEFAULT_CHALLENGES: ArenaChallenge[] = [
  {
    id: 'win_1',
    title: 'First Blood',
    description: 'Win 1 Arena Battle',
    reward: 50,
    rewardType: 'sparks',
    iconType: 'swords',
    targetCount: 1,
    category: 'battle',
    active: true
  },
  {
    id: 'win_3',
    title: 'Gladiator',
    description: 'Win 3 Arena Battles',
    reward: 200,
    rewardType: 'sparks',
    iconType: 'trophy',
    targetCount: 3,
    category: 'battle',
    active: true
  },
  {
    id: 'streak_2',
    title: 'On Fire',
    description: 'Achieve a 2-win streak in Arena',
    reward: 150,
    rewardType: 'sparks',
    iconType: 'flame',
    targetCount: 2,
    category: 'streak',
    active: true
  },
  {
    id: 'quiz_master',
    title: 'Quiz Ace',
    description: 'Complete 3 Practice Quizzes with >80% score',
    reward: 100,
    rewardType: 'sparks',
    iconType: 'star',
    targetCount: 3,
    category: 'quiz',
    active: true
  }
];

export const ChallengesService = {
  async getChallenges(): Promise<ArenaChallenge[]> {
    try {
      if (!db) return DEFAULT_CHALLENGES;
      const docRef = doc(db, 'system_config', 'challenges');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.challenges) && data.challenges.length > 0) {
          return data.challenges;
        }
      }
    } catch (e) {
      console.warn('Using default challenges due to fetch error:', e);
    }
    return DEFAULT_CHALLENGES;
  },

  subscribeChallenges(callback: (challenges: ArenaChallenge[]) => void): () => void {
    if (!db) {
      callback(DEFAULT_CHALLENGES);
      return () => {};
    }
    const docRef = doc(db, 'system_config', 'challenges');
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.challenges) && data.challenges.length > 0) {
          callback(data.challenges);
          return;
        }
      }
      callback(DEFAULT_CHALLENGES);
    }, (error) => {
      console.warn('Challenges snapshot error, fallback to defaults:', error);
      callback(DEFAULT_CHALLENGES);
    });
  },

  async saveChallenges(challenges: ArenaChallenge[]): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');
    const docRef = doc(db, 'system_config', 'challenges');
    await setDoc(docRef, {
      challenges,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
  }
};
