import React, { createContext, useContext, useState, useEffect } from 'react';
import { Course, CourseId } from '../types';
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
        querySnapshot.forEach((docSnap: any) => {
          const data = docSnap.data() as Course & { deleted?: boolean };
          const courseId = docSnap.id;
          data.id = courseId as CourseId;
          if (!data.deleted) {
            firestoreCourses[courseId] = data;
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
      const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map((e: string) => e.trim().toLowerCase()).filter(Boolean);
      const isAdmin = Boolean(user.email && adminEmails.includes(user.email.toLowerCase()));
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
          const hydrationPromises: Promise<void>[] = [];

          querySnapshot.forEach((docSnap: any) => {
            const data = docSnap.data() as Course & { deleted?: boolean; department?: string };
            const courseId = docSnap.id;
            data.id = courseId as CourseId;

            if (!data.deleted) {
              if (!data.scope) data.scope = 'DEPARTMENT';
              if (!data.faculties) data.faculties = [];
              if (!data.departments || data.departments.length === 0) {
                data.departments = (data as any).department ? [(data as any).department as any] : [];
              }
              if (!data.level) data.level = '100';
              if (!data.semester) data.semester = '1st Semester';
              
              firestoreCourses[courseId] = data;

              // Fallback: If syllabus is missing or empty, hydrate from subcollections
              if (!data.syllabus || data.syllabus.length === 0) {
                const promise = (async () => {
                  try {
                    const { CourseService } = await import('../services/courseService');
                    const modules = await CourseService.getModules(courseId);
                    if (modules && modules.length > 0) {
                      const populatedModules = await Promise.all(
                        modules.map(async (mod) => {
                          const lessons = await CourseService.getLessons(courseId, mod.id);
                          return {
                            id: mod.id,
                            title: mod.title,
                            subTopics: lessons || []
                          };
                        })
                      );
                      firestoreCourses[courseId].syllabus = populatedModules;
                    }
                  } catch (hErr) {
                    console.warn(`Failed hydrating subcollection syllabus for ${courseId}:`, hErr);
                  }
                })();
                hydrationPromises.push(promise);
              }
            }
          });

          if (hydrationPromises.length > 0) {
            Promise.all(hydrationPromises).then(() => {
              setCourses({ ...firestoreCourses });
            });
          }

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
