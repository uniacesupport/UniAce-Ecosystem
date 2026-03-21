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
    // Placeholder condition, would need quiz history
    condition: (progress: UserProgress) => false, 
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
      const q = query(collection(db, 'users'), orderBy('xp', 'desc'), limit(10));
      const querySnapshot = await getDocs(q);
      
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

      // If empty (e.g. no users yet), return mock data
      if (leaderboard.length === 0) {
        return this.getMockLeaderboard();
      }

      return leaderboard;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return this.getMockLeaderboard();
    }
  }

  private static getMockLeaderboard(): LeaderboardEntry[] {
    return [
      { userId: '1', displayName: 'Alice', photoURL: '', xp: 1250, rank: 1, streak: 5 },
      { userId: '2', displayName: 'Bob', photoURL: '', xp: 980, rank: 2, streak: 3 },
      { userId: '3', displayName: 'Charlie', photoURL: '', xp: 850, rank: 3, streak: 12 },
      { userId: '4', displayName: 'Diana', photoURL: '', xp: 720, rank: 4, streak: 1 },
      { userId: '5', displayName: 'Evan', photoURL: '', xp: 600, rank: 5, streak: 0 },
    ];
  }
}
