import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  selectedLevel: string;
  setSelectedLevel: (level: string) => void;
  lastAccessedCourses: string[];
  addLastAccessedCourse: (courseId: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedLevel: '100L',
      setSelectedLevel: (level) => set({ selectedLevel: level }),
      lastAccessedCourses: [],
      addLastAccessedCourse: (courseId) => set((state) => ({
        lastAccessedCourses: [courseId, ...state.lastAccessedCourses.filter(id => id !== courseId)].slice(0, 5)
      })),
      theme: 'light',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
    }),
    {
      name: 'uniace-storage',
    }
  )
);
