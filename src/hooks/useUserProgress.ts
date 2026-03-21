import { useState, useEffect, useCallback } from 'react';
import { UserProgress, Achievement, Bookmark, CourseId, AIPersonality } from '../types';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, setDoc, onSnapshot, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { GamificationService, BADGES } from '../services/gamification';

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
  enrolledCourses: ['MAT103'], // Default enrollment
  assignments: [
    { id: 'a1', courseId: 'MAT103', title: 'Vector Calculus Problem Set', dueDate: new Date(Date.now() + 86400000 * 3).toISOString(), status: 'pending' },
    { id: 'a2', courseId: 'MAT103', title: 'Coordinate Geometry Quiz', dueDate: new Date(Date.now() + 86400000 * 5).toISOString(), status: 'pending' },
    { id: 'a3', courseId: 'STA112', title: 'Probability Distributions', dueDate: new Date(Date.now() - 86400000 * 2).toISOString(), status: 'graded', grade: 85 },
  ],
};

export function useUserProgress() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [progress, setProgress] = useState<UserProgress>(() => {
    let parsed = INITIAL_PROGRESS;
    try {
      const saved = localStorage.getItem('mat103_progress');
      if (saved) {
        parsed = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('localStorage access denied or invalid JSON, using initial progress');
    }
    // Ensure new fields exist for existing users
    return {
      ...INITIAL_PROGRESS,
      ...parsed,
      topicLastStudied: parsed.topicLastStudied || {},
      bookmarks: parsed.bookmarks || []
    };
  });

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Merge function to combine local and server data
  const mergeProgress = useCallback((local: UserProgress, server: UserProgress): UserProgress => {
    const mergedMastery = { ...local.mastery, ...server.mastery };
    // Take the higher mastery score if it exists in both
    Object.keys(mergedMastery).forEach(key => {
      if (local.mastery[key] && server.mastery[key]) {
        mergedMastery[key] = Math.max(local.mastery[key], server.mastery[key]);
      }
    });

    const mergedStudyTime = { ...local.studyTime, ...server.studyTime };
    Object.keys(mergedStudyTime).forEach(key => {
      if (local.studyTime[key] && server.studyTime[key]) {
        mergedStudyTime[key] = Math.max(local.studyTime[key], server.studyTime[key]);
      }
    });

    const mergedTopicLastStudied = { ...local.topicLastStudied, ...server.topicLastStudied };
    // Take the more recent date
    Object.keys(mergedTopicLastStudied).forEach(key => {
      if (local.topicLastStudied[key] && server.topicLastStudied[key]) {
        const localDate = new Date(local.topicLastStudied[key]);
        const serverDate = new Date(server.topicLastStudied[key]);
        mergedTopicLastStudied[key] = localDate > serverDate ? local.topicLastStudied[key] : server.topicLastStudied[key];
      }
    });

    // Merge bookmarks by ID
    const bookmarkMap = new Map<string, any>();
    [...(local.bookmarks || []), ...(server.bookmarks || [])].forEach(b => bookmarkMap.set(b.id, b));
    const mergedBookmarks = Array.from(bookmarkMap.values());

    // Merge achievements
    const achievementMap = new Map<string, Achievement>();
    [...(local.achievements || []), ...(server.achievements || [])].forEach(a => {
      const existing = achievementMap.get(a.id);
      if (!existing || (a.unlockedAt && (!existing.unlockedAt))) {
        achievementMap.set(a.id, a);
      }
    });
    const mergedAchievements = Array.from(achievementMap.values());

    // Merge assignments by ID
    const assignmentMap = new Map<string, any>();
    [...(local.assignments || []), ...(server.assignments || [])].forEach(a => assignmentMap.set(a.id, a));
    const mergedAssignments = Array.from(assignmentMap.values());

    return {
      xp: Math.max(local.xp, server.xp),
      level: Math.max(local.level, server.level),
      streak: Math.max(local.streak, server.streak),
      lastStudyDate: local.lastStudyDate && server.lastStudyDate 
        ? (new Date(local.lastStudyDate) > new Date(server.lastStudyDate) ? local.lastStudyDate : server.lastStudyDate)
        : (local.lastStudyDate || server.lastStudyDate),
      mastery: mergedMastery,
      achievements: mergedAchievements,
      studyTime: mergedStudyTime,
      topicLastStudied: mergedTopicLastStudied,
      bookmarks: mergedBookmarks,
      enrolledCourses: Array.from(new Set([...(local.enrolledCourses || []), ...(server.enrolledCourses || [])])),
      assignments: mergedAssignments,
    };
  }, []);

  // Sync with Firestore when user logs in or comes online
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const serverData = docSnap.data() as UserProgress;
        const mergedData = mergeProgress(progress, {
          ...INITIAL_PROGRESS,
          ...serverData,
          topicLastStudied: serverData.topicLastStudied || {},
          bookmarks: serverData.bookmarks || []
        });

        // Only update if data is different to avoid loops/re-renders
        setProgress(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(mergedData)) {
            return mergedData;
          }
          return prev;
        });
      } else {
        // If new user, sync local progress to Firestore
        if (isOnline) {
          setDoc(userDocRef, progress, { merge: true }).catch(err => {
            console.error("Error syncing initial user progress to Firestore:", err);
          });
        }
      }
    }, (error) => {
      console.error("Error syncing user progress:", error);
    });

    return () => unsubscribe();
  }, [user, isOnline, mergeProgress]); // Re-run when online status changes to force sync

  // Persist changes to LocalStorage and Firestore
  useEffect(() => {
    try {
      localStorage.setItem('mat103_progress', JSON.stringify(progress));
    } catch (e) {
      console.warn('localStorage access denied, cannot save progress locally');
    }
    
    if (user && isOnline) {
      const userDocRef = doc(db, 'users', user.uid);
      // Use a timeout to debounce writes slightly
      const timeoutId = setTimeout(() => {
        setDoc(userDocRef, progress, { merge: true }).catch(err => {
          console.error("Error persisting user progress to Firestore:", err);
        });
      }, 1000); // Increased debounce to 1s to reduce writes
      
      // Add a beforeunload listener to flush pending changes
      const handleBeforeUnload = () => {
        // We can't use async setDoc here reliably, but we can try a beacon or just hope the debounce handled it
        // Actually, for critical data, we should have a 'flush' mechanism
        setDoc(userDocRef, progress, { merge: true }).catch(() => {});
      };
      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [progress, user, isOnline]);

  const saveImmediately = useCallback(async (newProgress: UserProgress) => {
    if (!user || !isOnline) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, newProgress, { merge: true });
    } catch (err) {
      console.error("Error in immediate sync:", err);
    }
  }, [user, isOnline]);

  const addXp = (amount: number) => {
    setProgress(prev => {
      const newXp = prev.xp + amount;
      const newLevel = GamificationService.calculateLevel(newXp).level;
      
      // Check for new badges
      const tempProgress = { ...prev, xp: newXp, level: newLevel };
      const newBadges = GamificationService.checkNewBadges(tempProgress);
      
      let updatedAchievements = [...prev.achievements];
      if (newBadges.length > 0) {
        newBadges.forEach(newBadge => {
          const index = updatedAchievements.findIndex(a => a.id === newBadge.id);
          if (index !== -1) {
            updatedAchievements[index] = newBadge;
          } else {
            updatedAchievements.push(newBadge);
          }
        });
      }

      const finalProgress = { ...prev, xp: newXp, level: newLevel, achievements: updatedAchievements };
      // If level up, save immediately
      if (newLevel > prev.level) {
        saveImmediately(finalProgress);
      }
      return finalProgress;
    });
  };

  const updateMastery = (topicId: string, score: number) => {
    setProgress(prev => {
      const currentMastery = prev.mastery[topicId] || 0;
      const newMastery = Math.max(currentMastery, score);
      
      if (score > currentMastery) {
        // Log mastery improvement
        import('../services/logService').then(({ LogService }) => {
          LogService.log('success', 'user', `Improved mastery for ${topicId}: ${currentMastery}% -> ${score}%`);
        });
      }

      const tempProgress = { 
        ...prev, 
        mastery: { ...prev.mastery, [topicId]: newMastery },
        topicLastStudied: { ...prev.topicLastStudied, [topicId]: new Date().toISOString() },
        lastStudyDate: new Date().toISOString()
      };

      // Check for achievements
      const newBadges = GamificationService.checkNewBadges(tempProgress);
      let updatedAchievements = [...prev.achievements];
      
      if (newBadges.length > 0) {
        newBadges.forEach(newBadge => {
          const index = updatedAchievements.findIndex(a => a.id === newBadge.id);
          if (index !== -1) {
            updatedAchievements[index] = newBadge;
          } else {
            updatedAchievements.push(newBadge);
          }
        });
      }

      const finalProgress = { 
        ...tempProgress,
        achievements: updatedAchievements,
      };

      // If mastery improved significantly (e.g., > 10% or reached 100%), save immediately
      if (score - currentMastery > 10 || score === 100) {
        saveImmediately(finalProgress);
      }

      return finalProgress;
    });
  };

  const recordStudyTime = (topicId: string, seconds: number) => {
    setProgress(prev => ({
      ...prev,
      studyTime: { ...prev.studyTime, [topicId]: (prev.studyTime[topicId] || 0) + seconds }
    }));
  };

  const unlockAchievement = (id: string) => {
    setProgress(prev => ({
      ...prev,
      achievements: prev.achievements.map(a => 
        a.id === id && !a.unlockedAt ? { ...a, unlockedAt: new Date().toISOString() } : a
      )
    }));
  };

  const markTopicAsStudied = (topicId: string) => {
    setProgress(prev => ({
      ...prev,
      topicLastStudied: { ...prev.topicLastStudied, [topicId]: new Date().toISOString() },
      lastStudyDate: new Date().toISOString()
    }));
  };

  const addBookmark = (item: any, type: 'formula' | 'question', note?: string) => {
    const newBookmark = {
      id: crypto.randomUUID(),
      type,
      content: item,
      timestamp: new Date().toISOString(),
      note
    };
    setProgress(prev => ({
      ...prev,
      bookmarks: [...prev.bookmarks, newBookmark]
    }));
  };

  const removeBookmark = (bookmarkId: string) => {
    setProgress(prev => ({
      ...prev,
      bookmarks: prev.bookmarks.filter(b => b.id !== bookmarkId)
    }));
  };

  const enrollCourse = async (courseId: CourseId, courseTitle?: string, courseDesc?: string) => {
    setProgress(prev => {
      if (prev.enrolledCourses?.includes(courseId)) return prev;
      
      // Log enrollment
      import('../services/logService').then(({ LogService }) => {
        LogService.log('info', 'user', `Enrolled in course: ${courseTitle || courseId}`);
      });

      return {
        ...prev,
        enrolledCourses: [...(prev.enrolledCourses || []), courseId]
      };
    });

    if (user && isOnline) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          enrolledCourses: arrayUnion(courseId)
        });

        // Check if course content exists in Firestore
        const { CourseService } = await import('../services/courseService');
        const course = await CourseService.getCourse(courseId);
        
        // If course doesn't exist or has no modules, and we have info to generate it
        if ((!course || !course.syllabus || course.syllabus.length === 0) && courseTitle) {
          const { generateCourseContent } = await import('../services/aiCourseGenerator');
          const generatedData = await generateCourseContent(courseTitle, courseDesc || '');
          await CourseService.saveGeneratedCourse(courseId, generatedData);
        }
      } catch (error: any) {
        console.error("Error updating enrolled courses or generating content:", error);
      }
    }
  };

  const updateSRSData = (cardId: string, data: any) => {
    setProgress(prev => ({
      ...prev,
      srsData: {
        ...prev.srsData,
        [cardId]: data
      }
    }));
  };

  const updateAIPersonality = (personality: AIPersonality) => {
    setProgress(prev => ({
      ...prev,
      aiPersonality: personality
    }));
  };

  return { progress, addXp, updateMastery, recordStudyTime, unlockAchievement, markTopicAsStudied, addBookmark, removeBookmark, enrollCourse, updateSRSData, updateAIPersonality, isOnline };
}
