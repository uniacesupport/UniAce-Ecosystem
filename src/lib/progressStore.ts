import { create } from 'zustand';
import { UserProgress, Achievement } from '../types';
import { BADGES } from '../services/gamification';

const INITIAL_ACHIEVEMENTS: Achievement[] = BADGES.map(b => ({
  id: b.id,
  title: b.title,
  description: b.description,
  icon: b.icon,
  unlockedAt: null
}));

const INITIAL_PROGRESS: UserProgress = {
  xp: 0,
  level: 1,
  streak: 0,
  lastStudyDate: null,
  mastery: {},
  achievements: INITIAL_ACHIEVEMENTS,
  studyTime: {},
  topicLastStudied: {},
  bookmarks: [],
  enrolledCourses: [],
  assignments: [
    { id: 'a1', courseId: 'MTH103', title: 'Vector Calculus Problem Set', dueDate: new Date(Date.now() + 86400000 * 3).toISOString(), status: 'pending' },
    { id: 'a2', courseId: 'MTH103', title: 'Coordinate Geometry Quiz', dueDate: new Date(Date.now() + 86400000 * 5).toISOString(), status: 'pending' },
    { id: 'a3', courseId: 'STA112', title: 'Probability Distributions', dueDate: new Date(Date.now() - 86400000 * 2).toISOString(), status: 'graded', grade: 85 },
  ],
};

function getInitialProgress(): UserProgress {
  let parsed = INITIAL_PROGRESS;
  try {
    const saved = localStorage.getItem('mat103_progress');
    if (saved) {
      parsed = JSON.parse(saved);
    }
  } catch (e) {
    console.warn('localStorage access denied or invalid JSON, using initial progress');
  }
  return {
    ...INITIAL_PROGRESS,
    ...parsed,
    topicLastStudied: parsed?.topicLastStudied || {},
    bookmarks: parsed?.bookmarks || []
  };
}

interface ProgressState {
  progress: UserProgress;
  isOnline: boolean;
  integrityIssues: any[];
  setProgress: (updater: UserProgress | ((prev: UserProgress) => UserProgress)) => void;
  setIsOnline: (isOnline: boolean) => void;
  setIntegrityIssues: (issues: any[]) => void;
}

export const useProgressStore = create<ProgressState>((set) => ({
  progress: getInitialProgress(),
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  integrityIssues: [],
  setProgress: (updater) => set((state) => {
    const nextProgress = typeof updater === 'function' ? updater(state.progress) : updater;
    try {
      localStorage.setItem('mat103_progress', JSON.stringify(nextProgress));
    } catch (e) {
      console.warn('localStorage access denied, cannot save progress locally');
    }
    return { progress: nextProgress };
  }),
  setIsOnline: (isOnline) => set({ isOnline }),
  setIntegrityIssues: (integrityIssues) => set({ integrityIssues }),
}));
