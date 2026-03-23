import React, { createContext, useContext, useState, useEffect } from 'react';
import { Course } from '../types';
import { COURSES as DEFAULT_COURSES } from '../constants';
import { db } from '../firebase';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';

interface CourseContextType {
  courses: Record<string, Course>;
  loading: boolean;
  refreshCourses: () => Promise<void>;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export function CourseProvider({ children }: { children: React.ReactNode }) {
  const [courses, setCourses] = useState<Record<string, Course>>(DEFAULT_COURSES);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchCourses = async () => {
    // This is kept for backward compatibility if components call refreshCourses manually
    // but the real-time listener handles the actual state updates.
    if (!db) return;
    try {
      const querySnapshot = await getDocs(collection(db, 'courses'));
      if (!querySnapshot.empty) {
        const firestoreCourses: Record<string, Course> = { ...DEFAULT_COURSES };
        querySnapshot.forEach((doc: any) => {
          const data = doc.data() as Course & { deleted?: boolean };
          if (data.id) {
            if (data.deleted) {
              delete firestoreCourses[data.id];
            } else {
              firestoreCourses[data.id] = data;
            }
          }
        });
        setCourses(firestoreCourses);
      }
    } catch (error) {
      console.error("Error manually fetching courses:", error);
    }
  };

  useEffect(() => {
    if (!db) {
      console.warn("Firestore not initialized, using default courses");
      setCourses(DEFAULT_COURSES);
      setLoading(false);
      return;
    }

    // Only set up listener if user is authenticated (or if we want to allow public read, we can do it anyway, but depending on user ensures we retry after auth)
    console.log(`CourseContext: Setting up real-time listener for courses...`);
    setLoading(true);

    const unsubscribe = onSnapshot(
      collection(db, 'courses'),
      (querySnapshot) => {
        if (querySnapshot.empty) {
          console.log("No courses in Firestore, using default courses");
          setCourses(DEFAULT_COURSES);
        } else {
          const firestoreCourses: Record<string, Course> = { ...DEFAULT_COURSES };
          querySnapshot.forEach((doc: any) => {
            const data = doc.data() as Course & { deleted?: boolean };
            if (data.id) {
              if (data.deleted) {
                delete firestoreCourses[data.id];
              } else {
                firestoreCourses[data.id] = data;
              }
            }
          });
          setCourses(firestoreCourses);
          console.log("CourseContext: Courses synced successfully");
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error syncing courses:", error);
        // Fallback to default courses on error
        setCourses(DEFAULT_COURSES);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]); // Re-run when user changes (e.g., signs in)

  return (
    <CourseContext.Provider value={{ courses, loading, refreshCourses: fetchCourses }}>
      {children}
    </CourseContext.Provider>
  );
}

export function useCourses() {
  const context = useContext(CourseContext);
  if (context === undefined) {
    throw new Error('useCourses must be used within a CourseProvider');
  }
  return context;
}
