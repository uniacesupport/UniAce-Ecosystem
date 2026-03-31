import { db } from '../firebase';
import { collection, doc, getDoc, getDocs, setDoc, query, where, orderBy, writeBatch } from 'firebase/firestore';
import { Course, Module, SubTopic, Quiz, Formula, CourseId } from '../types';

const sanitizeForFirestore = (obj: any): any => {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (typeof obj !== 'object') return obj;
  
  // Only process arrays and plain objects. Preserve special objects (Date, FieldValue, etc.)
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item));
  }
  
  if (obj.constructor !== Object) {
    return obj; // It's a special object, return as-is
  }
  
  const sanitized: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = obj[key];
      if (val !== undefined) {
        sanitized[key] = sanitizeForFirestore(val);
      }
    }
  }
  return sanitized;
};

export const CourseService = {
  async getCourse(courseId: string): Promise<Course | null> {
    let retries = 3;
    while (retries > 0) {
      try {
        const courseDoc = await getDoc(doc(db, 'courses', courseId));
        if (courseDoc.exists()) {
          return { id: courseDoc.id, ...courseDoc.data() } as Course;
        }
        return null;
      } catch (error: any) {
        if (error.message?.includes('timeout') && retries > 1) {
          retries--;
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        throw error;
      }
    }
    return null;
  },

  async getModules(courseId: string): Promise<Module[]> {
    const modulesSnap = await getDocs(query(collection(db, `courses/${courseId}/modules`), orderBy('order')));
    return modulesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Module));
  },

  async getLessons(courseId: string, moduleId: string): Promise<SubTopic[]> {
    const lessonsSnap = await getDocs(query(collection(db, `courses/${courseId}/modules/${moduleId}/lessons`), orderBy('order')));
    return lessonsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubTopic));
  },

  async getQuiz(courseId: string, moduleId: string): Promise<Quiz | null> {
    const quizSnap = await getDocs(collection(db, `courses/${courseId}/modules/${moduleId}/quizzes`));
    if (!quizSnap.empty) {
      return { moduleId, ...quizSnap.docs[0].data() } as Quiz;
    }
    return null;
  },

  async getFormulas(courseId: string): Promise<Formula[]> {
    const formulasSnap = await getDocs(collection(db, `courses/${courseId}/formulas`));
    return formulasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Formula));
  },

  async saveGeneratedCourse(courseId: string, data: any) {
    const batch = writeBatch(db);
    
    // 1. Prepare syllabus for the main course document (compatibility)
    const syllabus = (data.modules || []).map((m: any, mIdx: number) => ({
      id: `m${mIdx + 1}`,
      title: m.title || `Module ${mIdx + 1}`,
      subTopics: (m.lessons || []).map((l: any, lIdx: number) => ({
        id: `m${mIdx + 1}-l${lIdx + 1}`,
        title: l.title || `Lesson ${lIdx + 1}`
      }))
    }));

    // 2. Update Course document
    const courseRef = doc(db, 'courses', courseId);
    batch.set(courseRef, sanitizeForFirestore({ 
      isAIGenerated: true,
      syllabus: syllabus
    }), { merge: true });

    // 3. Save Modules, Lessons, and Quizzes to sub-collections (scalability)
    (data.modules || []).forEach((moduleData: any, mIndex: number) => {
      const moduleId = `m${mIndex + 1}`;
      const moduleRef = doc(db, `courses/${courseId}/modules`, moduleId);
      batch.set(moduleRef, sanitizeForFirestore({
        title: moduleData.title || `Module ${mIndex + 1}`,
        order: mIndex + 1
      }));

      (moduleData.lessons || []).forEach((lessonData: any, lIndex: number) => {
        const lessonId = `m${mIndex + 1}-l${lIndex + 1}`;
        const lessonRef = doc(db, `courses/${courseId}/modules/${moduleId}/lessons`, lessonId);
        batch.set(lessonRef, sanitizeForFirestore({
          title: lessonData.title || `Lesson ${lIndex + 1}`,
          content: lessonData.content || '',
          order: lIndex + 1
        }));
      });

      const quizRef = doc(db, `courses/${courseId}/modules/${moduleId}/quizzes`, 'default');
      batch.set(quizRef, sanitizeForFirestore({
        questions: moduleData.quiz?.questions || []
      }));
    });

    await batch.commit();
  },

  async updateCourse(courseId: string, data: Partial<Course>) {
    const courseRef = doc(db, 'courses', courseId);
    await setDoc(courseRef, sanitizeForFirestore(data), { merge: true });
  },

  async archiveCourse(courseId: string) {
    const courseRef = doc(db, 'courses', courseId);
    await setDoc(courseRef, { status: 'archived' }, { merge: true });
  }
};
