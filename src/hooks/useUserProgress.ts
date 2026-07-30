import { useState, useEffect, useCallback, useMemo } from 'react';
import { UserProgress, Achievement, Bookmark, CourseId, AIPersonality, Department } from '../types';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, setDoc, onSnapshot, getDoc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { GamificationService, BADGES } from '../services/gamification';
import { useCourses } from '../context/CourseContext';
import { DEPARTMENT_TO_FACULTY } from '../constants';
import { CurriculumIntegrityService } from '../services/curriculumIntegrity';
import { useProgressStore } from '../lib/progressStore';

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
  enrolledCourses: [], // Default enrollment
  assignments: [
    { id: 'a1', courseId: 'MTH103', title: 'Vector Calculus Problem Set', dueDate: new Date(Date.now() + 86400000 * 3).toISOString(), status: 'pending' },
    { id: 'a2', courseId: 'MTH103', title: 'Coordinate Geometry Quiz', dueDate: new Date(Date.now() + 86400000 * 5).toISOString(), status: 'pending' },
    { id: 'a3', courseId: 'STA112', title: 'Probability Distributions', dueDate: new Date(Date.now() - 86400000 * 2).toISOString(), status: 'graded', grade: 85 },
  ],
};

export function useUserProgress() {
  const { user, profile } = useAuth();
  const { progress, setProgress, isOnline, setIsOnline, integrityIssues, setIntegrityIssues } = useProgressStore();

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

    const mergedBookmarks = server.bookmarks || local.bookmarks || [];

    // Merge achievements
    const achievementMap = new Map<string, Achievement>();
    [...(local.achievements || []), ...(server.achievements || [])].forEach(a => {
      const existing = achievementMap.get(a.id);
      if (!existing || (a.unlockedAt && (!existing.unlockedAt))) {
        achievementMap.set(a.id, a);
      }
    });
    const mergedAchievements = Array.from(achievementMap.values());

    const mergedAssignments = server.assignments || local.assignments || [];

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
      enrolledCourses: server.enrolledCourses || local.enrolledCourses || [],
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
        
        setProgress(prev => {
          const mergedData = mergeProgress(prev, {
            ...INITIAL_PROGRESS,
            ...serverData,
            topicLastStudied: serverData.topicLastStudied || {},
            bookmarks: serverData.bookmarks || []
          });

          // Only update if data is actually different to avoid unnecessary re-renders
          if (JSON.stringify(prev) !== JSON.stringify(mergedData)) {
            return mergedData;
          }
          return prev;
        });
      } else {
        // If new user, sync local progress to Firestore
        if (isOnline) {
          const { 
            xp, level, mastery, achievements, enrolledCourses, 
            role, plan_type, subscription_expiry, subscription_status, 
            subscription_start_date, last_spark_reset, last_payment_ref, 
            ai_sparks, ...allowedProgress 
          } = progress as any;
          setDoc(userDocRef, { ...allowedProgress, uid: user.uid }, { merge: true }).catch(err => {
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
      const { 
        xp, level, mastery, achievements, enrolledCourses, 
        role, plan_type, subscription_expiry, subscription_status, 
        subscription_start_date, last_spark_reset, last_payment_ref, 
        ai_sparks, ...allowedProgress 
      } = progress as any;

      // Use a timeout to debounce writes slightly
      const timeoutId = setTimeout(() => {
        setDoc(userDocRef, { ...allowedProgress, uid: user.uid }, { merge: true }).catch(err => {
          console.error("Error persisting user progress to Firestore:", err);
        });
      }, 1000); // Increased debounce to 1s to reduce writes
      
      // Add a beforeunload listener to flush pending changes
      const handleBeforeUnload = () => {
        // We can't use async setDoc here reliably, but we can try a beacon or just hope the debounce handled it
        // Actually, for critical data, we should have a 'flush' mechanism
        const { 
          xp, level, mastery, achievements, enrolledCourses, 
          role, plan_type, subscription_expiry, subscription_status, 
          subscription_start_date, last_spark_reset, last_payment_ref, 
          ai_sparks, ...allowedProgressUnload 
        } = progress as any;
        setDoc(userDocRef, { ...allowedProgressUnload, uid: user.uid }, { merge: true }).catch(() => {});
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
      const { 
        xp, level, mastery, achievements, enrolledCourses, 
        role, plan_type, subscription_expiry, subscription_status, 
        subscription_start_date, last_spark_reset, last_payment_ref, 
        ai_sparks, ...allowedProgress 
      } = newProgress as any;
      await setDoc(userDocRef, { ...allowedProgress, uid: user.uid }, { merge: true });
    } catch (err) {
      console.error("Error in immediate sync:", err);
    }
  }, [user, isOnline]);

  const processNewBadges = (prevAchievements: Achievement[], newBadges: Achievement[]) => {
    let updatedAchievements = [...prevAchievements];
    let totalSparksReward = 0;
    
    if (newBadges.length > 0) {
      newBadges.forEach(newBadge => {
        const index = updatedAchievements.findIndex(a => a.id === newBadge.id);
        if (index !== -1) {
          updatedAchievements[index] = newBadge;
        } else {
          updatedAchievements.push(newBadge);
          // Award sparks for new badges (e.g., 50 sparks per badge)
          totalSparksReward += 50; 
        }
      });
    }

    return { updatedAchievements, totalSparksReward };
  };

  const awardBadgeSparks = async (amount: number) => {
    if (amount > 0 && user && isOnline) {
      try {
        const idToken = await user.getIdToken();
        await fetch('/api/user/reward-badge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ amount })
        });
        import('../services/logService').then(({ LogService }) => {
          LogService.log('success', 'user', `Awarded ${amount} AI Sparks for unlocking badges!`).catch(console.error);
        });
      } catch (err) {
        console.error("Error awarding sparks:", err);
      }
    }
  };

  const addXp = (amount: number) => {
    let sparksToAward = 0;
    setProgress(prev => {
      const newXp = prev.xp + amount;
      const newLevel = GamificationService.calculateLevel(newXp).level;
      
      const tempProgress = { ...prev, xp: newXp, level: newLevel };
      const newBadges = GamificationService.checkNewBadges(tempProgress);
      
      const { updatedAchievements, totalSparksReward } = processNewBadges(prev.achievements, newBadges);
      sparksToAward = totalSparksReward;

      const finalProgress = { ...prev, xp: newXp, level: newLevel, achievements: updatedAchievements };
      if (newLevel > prev.level) {
        saveImmediately(finalProgress);
      }
      return finalProgress;
    });

    if (sparksToAward > 0) {
      awardBadgeSparks(sparksToAward);
    }

    if (user && isOnline) {
      user.getIdToken().then(idToken => {
        fetch('/api/user/reward-xp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ amount })
        }).catch(err => console.error("Error rewarding XP on server:", err));
      });
    }
  };

  const checkAndUpdateStreak = () => {
    setProgress(prev => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let newStreak = prev.streak;
      let newLastStudyDate = prev.lastStudyDate;

      if (prev.lastStudyDate) {
        const lastStudy = new Date(prev.lastStudyDate);
        lastStudy.setHours(0, 0, 0, 0);
        
        const diffTime = Math.abs(today.getTime() - lastStudy.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (diffDays === 1) {
          // Studied yesterday, increment streak
          newStreak += 1;
          newLastStudyDate = new Date().toISOString();
        } else if (diffDays > 1) {
          // Missed a day, reset streak
          newStreak = 1;
          newLastStudyDate = new Date().toISOString();
        } else {
          // Already studied today, do nothing
          return prev;
        }
      } else {
        // First time studying
        newStreak = 1;
        newLastStudyDate = new Date().toISOString();
      }

      const tempProgress = { ...prev, streak: newStreak, lastStudyDate: newLastStudyDate };
      const newBadges = GamificationService.checkNewBadges(tempProgress);
      
      const { updatedAchievements, totalSparksReward } = processNewBadges(prev.achievements, newBadges);
      
      if (totalSparksReward > 0) {
        awardBadgeSparks(totalSparksReward);
      }

      const finalProgress = { ...tempProgress, achievements: updatedAchievements };
      saveImmediately(finalProgress);
      return finalProgress;
    });
  };

  const updateMastery = async (topicId: string, score: number) => {
    let sparksToAward = 0;
    setProgress(prev => {
      const currentMastery = prev.mastery[topicId] || 0;
      const newMastery = Math.max(currentMastery, score);
      
      if (score > currentMastery) {
        // Log mastery improvement
        import('../services/logService').then(({ LogService }) => {
          LogService.log('success', 'user', `Improved mastery for ${topicId}: ${currentMastery}% -> ${score}%`).catch(console.error);
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
      const { updatedAchievements, totalSparksReward } = processNewBadges(prev.achievements, newBadges);
      sparksToAward = totalSparksReward;

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

    if (sparksToAward > 0) {
      awardBadgeSparks(sparksToAward);
    }

    if (user && isOnline) {
      user.getIdToken().then(idToken => {
        fetch('/api/user/update-mastery', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ topicId, score })
        }).catch(err => console.error("Error updating mastery on server:", err));
      });
    }
  };

  
  const recordQuizScore = (courseId: string, topicId: string, score: number) => {
    setProgress(prev => {
      const history = prev.quizHistory || [];
      const newHistory = [...history, {
        date: new Date().toISOString(),
        score,
        courseId,
        topicId
      }];
      // Keep only last 100 quizzes to prevent unlimited growth
      if (newHistory.length > 100) newHistory.shift();
      const tempProgress = {
        ...prev,
        quizHistory: newHistory,
        quizzesCompleted: (prev.quizzesCompleted || 0) + 1
      };
      saveImmediately(tempProgress);
      return tempProgress;
    });
  };

  const recordStudyTime = (topicId: string, seconds: number) => {
    setProgress(prev => ({
      ...prev,
      studyTime: { ...prev.studyTime, [topicId]: (prev.studyTime[topicId] || 0) + seconds }
    }));
    // Check streak when studying
    checkAndUpdateStreak();
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
        LogService.log('info', 'user', `Enrolled in course: ${courseTitle || courseId}`).catch(console.error);
      });

      return {
        ...prev,
        enrolledCourses: [...(prev.enrolledCourses || []), courseId]
      };
    });

    if (user && isOnline) {
      try {
        const idToken = await user.getIdToken();
        await fetch('/api/user/enroll-course', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ courseId })
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

  const unenrollCourse = async (courseId: CourseId) => {
    setProgress(prev => {
      if (!prev.enrolledCourses?.includes(courseId)) return prev;
      
      // Log unenrollment
      import('../services/logService').then(({ LogService }) => {
        LogService.log('info', 'user', `Unenrolled from course: ${courseId}`).catch(console.error);
      });

      return {
        ...prev,
        enrolledCourses: prev.enrolledCourses.filter(id => id !== courseId)
      };
    });

    if (user && isOnline) {
      try {
        const idToken = await user.getIdToken();
        await fetch('/api/user/unenroll-course', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ courseId })
        });
      } catch (error: any) {
        console.error("Error updating enrolled courses:", error);
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

  const { courses } = useCourses();

  const effectiveEnrolledCourses = useMemo(() => {
    const explicit = progress.enrolledCourses || [];
    if (!profile?.department || !profile?.academic_level || !profile?.semester) {
      return explicit;
    }

    const normalize = (s: any) => String(s || '').toLowerCase().trim().replace(/\s+/g, ' ');
    const extractLevel = (lvl: any) => String(lvl || '').match(/\d+/)?.[0] || '';
    
    const userDept = normalize(profile.department);
    const derivedFaculty = profile.faculty || DEPARTMENT_TO_FACULTY[profile.department as Department] || '';
    const userFaculty = normalize(derivedFaculty);
    const userLevel = extractLevel(profile.academic_level);
    const userSemester = normalize(profile.semester);

    const autoEnrolled = Object.values(courses)
      .filter(c => {
        // 1. Check Level (Mandatory for all scopes)
        const levelMatch = extractLevel(c.level) === userLevel;
        
        if (!levelMatch) return false;

        // 2. Check Scope
        const scope = c.scope || 'DEPARTMENT';
        
        if (scope === 'GLOBAL') return true;
        
        if (scope === 'FACULTY') {
          const courseFaculties = c.faculties || [];
          return courseFaculties.some(f => normalize(f) === userFaculty);
        }
        
        // Default: DEPARTMENT scope
        const courseDepts = c.departments || ((c as any).department ? [(c as any).department] : []);
        return courseDepts.some(d => normalize(d) === userDept);
      })
      .map(c => c.id as CourseId);
    return Array.from(new Set([...explicit, ...autoEnrolled]));
  }, [progress.enrolledCourses, profile, courses]);

  const effectiveProgress = useMemo(() => ({
    ...progress,
    enrolledCourses: effectiveEnrolledCourses
  }), [progress, effectiveEnrolledCourses]);

  // Curriculum Integrity Watchdog
  useEffect(() => {
    if (!user || !profile || !isOnline) return;
    
    // Only validate if profile is complete
    if (!profile.department || !profile.academic_level || !profile.semester) return;

    const validate = async () => {
      try {
        const issues = await CurriculumIntegrityService.validateUserCurriculum(
          user.uid,
          profile,
          effectiveEnrolledCourses
        );
        setIntegrityIssues(issues);
      } catch (error) {
        console.error("Integrity validation failed:", error);
      }
    };

    // Debounce validation to avoid spamming Firestore
    const timer = setTimeout(validate, 2000);
    return () => clearTimeout(timer);
  }, [user, profile, effectiveEnrolledCourses, isOnline]);

  return { progress: effectiveProgress, integrityIssues, addXp, updateMastery, recordQuizScore, recordStudyTime, unlockAchievement, markTopicAsStudied, addBookmark, removeBookmark, enrollCourse, unenrollCourse, updateSRSData, updateAIPersonality, isOnline, checkAndUpdateStreak };
}
