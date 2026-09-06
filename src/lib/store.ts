import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  lastAccessedCourses: string[];
  addLastAccessedCourse: (courseId: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
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

