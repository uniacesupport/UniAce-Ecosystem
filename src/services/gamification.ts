import { UserProgress, Achievement, LeaderboardEntry } from '../types';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export const LEVELS = [
  { level: 1, xp: 0, title: 'Novice' },
  { level: 2, xp: 100, title: 'Apprentice' },
  { level: 3, xp: 300, title: 'Scholar' },
  { level: 4, xp: 600, title: 'Expert' },
  { level: 5, xp: 1000, title: 'Master' },
  { level: 6, xp: 1500, title: 'Grandmaster' },
  { level: 7, xp: 2200, title: 'Legend' },
  { level: 8, xp: 3000, title: 'Mythic' },
  { level: 9, xp: 4000, title: 'Divine' },
  { level: 10, xp: 5000, title: 'Omniscient' },
];

export const BADGES = [
  {
    id: 'first_steps',
    title: 'First Steps',
    description: 'Complete your first lesson.',
    icon: 'Footprints',
    condition: (progress: UserProgress) => Object.keys(progress.mastery).length >= 1,
    xpReward: 50,
  },
  {
    id: 'streak_3',
    title: 'Consistency is Key',
    description: 'Maintain a 3-day streak.',
    icon: 'Flame',
    condition: (progress: UserProgress) => progress.streak >= 3,
    xpReward: 100,
  },
  {
    id: 'streak_7',
    title: 'Unstoppable',
    description: 'Maintain a 7-day streak.',
    icon: 'Zap',
    condition: (progress: UserProgress) => progress.streak >= 7,
    xpReward: 300,
  },
  {
    id: 'streak_14',
    title: 'Habit Builder',
    description: 'Maintain a 14-day streak.',
    icon: 'Calendar',
    condition: (progress: UserProgress) => progress.streak >= 14,
    xpReward: 500,
  },
  {
    id: 'streak_30',
    title: 'Scholar of the Month',
    description: 'Maintain a 30-day streak.',
    icon: 'Crown',
    condition: (progress: UserProgress) => progress.streak >= 30,
    xpReward: 1000,
  },
  {
    id: 'master_1',
    title: 'Topic Master',
    description: 'Achieve 100% mastery in one topic.',
    icon: 'Award',
    condition: (progress: UserProgress) => Object.values(progress.mastery).some((m) => m >= 100),
    xpReward: 200,
  },
  {
    id: 'quiz_whiz',
    title: 'Quiz Whiz',
    description: 'Complete 5 quizzes perfectly.',
    icon: 'Brain',
    condition: (progress: UserProgress) => (progress.quizzesCompleted || 0) >= 5, 
    xpReward: 150,
  },
];

export class GamificationService {
  static calculateLevel(xp: number) {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (xp >= LEVELS[i].xp) {
        return LEVELS[i];
      }
    }
    return LEVELS[0];
  }

  static getNextLevel(xp: number) {
    for (let i = 0; i < LEVELS.length; i++) {
      if (xp < LEVELS[i].xp) {
        return LEVELS[i];
      }
    }
    return null; // Max level reached
  }

  static checkNewBadges(progress: UserProgress): Achievement[] {
    const newBadges: Achievement[] = [];
    const existingBadgeIds = new Set(progress.achievements.map((a) => a.id));

    for (const badge of BADGES) {
      if (!existingBadgeIds.has(badge.id) && badge.condition(progress)) {
        newBadges.push({
          id: badge.id,
          title: badge.title,
          description: badge.description,
          icon: badge.icon,
          unlockedAt: new Date().toISOString(),
        });
      }
    }

    return newBadges;
  }

  static async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const q = query(collection(db, 'public_leaderboard'), orderBy('xp', 'desc'), limit(10));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const leaderboard: LeaderboardEntry[] = [];
        let rank = 1;

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          leaderboard.push({
            userId: doc.id,
            displayName: data.displayName || 'Anonymous Scholar',
            photoURL: data.photoURL || '',
            xp: data.xp || 0,
            rank: rank++,
            streak: data.streak || 0,
          });
        });

        return leaderboard;
      }

      // Fallback to backend API
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const json = await res.json();
        if (json.leaders && json.leaders.length > 0) {
          return json.leaders.map((l: any, idx: number) => ({
            userId: l.uid,
            displayName: l.displayName || 'Scholar',
            photoURL: l.photoURL || '',
            xp: l.xp || 0,
            rank: idx + 1,
            streak: l.streak || 0,
          }));
        }
      }
      return [];
    } catch (error) {
      console.error('Error fetching leaderboard from public_leaderboard:', error);
      try {
        const res = await fetch('/api/leaderboard');
        if (res.ok) {
          const json = await res.json();
          if (json.leaders) {
            return json.leaders.map((l: any, idx: number) => ({
              userId: l.uid,
              displayName: l.displayName || 'Scholar',
              photoURL: l.photoURL || '',
              xp: l.xp || 0,
              rank: idx + 1,
              streak: l.streak || 0,
            }));
          }
        }
      } catch (fallbackErr) {
        console.error('Fallback leaderboard error:', fallbackErr);
      }
      return [];
    }
  }
}
