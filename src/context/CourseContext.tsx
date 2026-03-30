import React, { createContext, useContext, useState, useEffect } from 'react';
import { Course } from '../types';
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
  const [courses, setCourses] = useState<Record<string, Course>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchCourses = async () => {
    // This is kept for backward compatibility if components call refreshCourses manually
    // but the real-time listener handles the actual state updates.
    if (!db) return;
    try {
      const querySnapshot = await getDocs(collection(db, 'courses'));
      if (!querySnapshot.empty) {
        const firestoreCourses: Record<string, Course> = {};
        querySnapshot.forEach((doc: any) => {
          const data = doc.data() as Course & { deleted?: boolean };
          if (data.id) {
            if (!data.deleted) {
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
      console.warn("Firestore not initialized");
      setCourses({});
      setLoading(false);
      return;
    }

    // Temporary fix for courses which were accidentally merged with a tombstone
    const fixDeletedCourses = async () => {
      if (!user) return;
      
      // Check if user is admin based on email (matching firestore rules)
      const isAdmin = user.email === 'uniace.support@gmail.com' || user.email === 'olalekan4565@gmail.com';
      if (!isAdmin) return;

      try {
        const { collection, getDocs, doc, updateDoc, deleteField } = await import('firebase/firestore');
        const snapshot = await getDocs(collection(db, 'courses'));
        const batch: Promise<void>[] = [];
        snapshot.forEach(d => {
          const data = d.data();
          if (data.deleted === true && data.title) {
            console.log(`Fixing ${d.id} deleted flag...`);
            const docRef = doc(db, 'courses', d.id);
            batch.push(updateDoc(docRef, {
              deleted: deleteField(),
              deletedAt: deleteField()
            }));
          }
        });
        if (batch.length > 0) {
          await Promise.all(batch);
          console.log(`Fixed ${batch.length} courses.`);
        }
      } catch (e) {
        console.error("Error fixing deleted courses:", e);
      }
    };
    fixDeletedCourses();

    // Only set up listener if user is authenticated (or if we want to allow public read, we can do it anyway, but depending on user ensures we retry after auth)
    console.log(`CourseContext: Setting up real-time listener for courses...`);
    setLoading(true);

    const unsubscribe = onSnapshot(
      collection(db, 'courses'),
      (querySnapshot) => {
        if (querySnapshot.empty) {
          console.log("No courses in Firestore");
          setCourses({});
        } else {
          const firestoreCourses: Record<string, Course> = {};
          querySnapshot.forEach((doc: any) => {
            const data = doc.data() as Course & { deleted?: boolean; department?: string };
            if (data.id) {
              if (!data.deleted) {
                // Migration: Ensure scope, faculties, and departments are initialized
                if (!data.scope) {
                  data.scope = 'DEPARTMENT';
                }
                if (!data.faculties) {
                  data.faculties = [];
                }
                if (!data.departments || data.departments.length === 0) {
                  if ((data as any).department) {
                    data.departments = [(data as any).department as any];
                  } else {
                    data.departments = [];
                  }
                }
                
                // Migration: Ensure level and semester are strings and have defaults
                if (!data.level) {
                  data.level = '100';
                }
                if (!data.semester) {
                  data.semester = '1st Semester';
                }
                
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
        setCourses({});
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
