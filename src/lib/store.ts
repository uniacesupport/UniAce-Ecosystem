import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  lastAccessedCourses: string[];
  addLastAccessedCourse: (courseId: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      lastAccessedCourses: [],
      addLastAccessedCourse: (courseId) => 
        set((state) => {
          const updated = [courseId, ...state.lastAccessedCourses.filter(id => id !== courseId)].slice(0, 5);
          return { lastAccessedCourses: updated };
        }),
    }),
    {
      name: 'uniace-app-storage',
    }
  )
);
