import { getAdminApp } from '../firebaseAdmin';
import { getMemoryCache, setMemoryCache } from '../cache';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

/**
 * Dual-Driver Query Layer for UniAce Mastery Hub
 *
 * Phase 1 (Launch): Express In-Memory Cache + Firestore Admin
 * Phase 2 (Hybrid): Supabase Postgres for read-heavy static tables (courses, departments, curriculum, past_papers, question_bank)
 *                  + Firestore for Auth, Realtime Battles, and Atomic Spark Escrow.
 */

export interface CourseFilter {
  departmentId?: string;
  level?: number;
  limit?: number;
}

export interface PastPaperFilter {
  courseCode: string;
  year?: number;
  semester?: string;
  limit?: number;
}

export interface QuestionBankFilter {
  courseCode: string;
  topic?: string;
  difficulty?: string;
  limit?: number;
}

export class AcademicRepository {
  /**
   * Fetch Departments with dual-driver routing & memory caching
   */
  static async getDepartments(): Promise<any[]> {
    const cacheKey = 'academic_departments_all';
    const cached = getMemoryCache<any[]>(cacheKey);
    if (cached) return cached;

    // Driver Choice B: Supabase Postgres
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data, error } = await supabase.from('departments').select('*').order('code', { ascending: true });
          if (!error && data && data.length > 0) {
            setMemoryCache(cacheKey, data, 300); // 5 min TTL
            return data;
          }
        }
      } catch (err) {
        console.warn('Supabase query error for departments, falling back to Firestore:', err);
      }
    }

    // Driver Choice A (Fallback): Firestore Admin
    const app = getAdminApp();
    if (!app) return [];

    try {
      const snap = await app.firestore().collection('departments').get();
      const departments = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMemoryCache(cacheKey, departments, 300);
      return departments;
    } catch (err) {
      console.error('Firestore query error for departments:', err);
      return [];
    }
  }

  /**
   * Fetch Courses with dual-driver routing
   */
  static async getCourses(filter: CourseFilter = {}): Promise<any[]> {
    const cacheKey = `academic_courses_${filter.departmentId || 'all'}_${filter.level || 'all'}_${filter.limit || 50}`;
    const cached = getMemoryCache<any[]>(cacheKey);
    if (cached) return cached;

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          let query = supabase.from('courses').select('*');
          if (filter.departmentId) query = query.eq('department_id', filter.departmentId);
          if (filter.level) query = query.eq('level', filter.level);
          query = query.limit(filter.limit || 100);

          const { data, error } = await query;
          if (!error && data) {
            setMemoryCache(cacheKey, data, 180);
            return data;
          }
        }
      } catch (err) {
        console.warn('Supabase query error for courses, falling back to Firestore:', err);
      }
    }

    // Fallback: Firestore
    const app = getAdminApp();
    if (!app) return [];

    try {
      let ref: FirebaseFirestore.Query = app.firestore().collection('courses');
      if (filter.departmentId) ref = ref.where('departmentId', '==', filter.departmentId);
      if (filter.level) ref = ref.where('level', '==', Number(filter.level));
      ref = ref.limit(filter.limit || 100);

      const snap = await ref.get();
      const courses = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMemoryCache(cacheKey, courses, 180);
      return courses;
    } catch (err) {
      console.error('Firestore query error for courses:', err);
      return [];
    }
  }

  /**
   * Fetch Curriculum by Course Code
   */
  static async getCurriculum(courseCode: string): Promise<any | null> {
    const cacheKey = `academic_curriculum_${courseCode.toUpperCase()}`;
    const cached = getMemoryCache<any>(cacheKey);
    if (cached) return cached;

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('curriculum')
            .select('*')
            .eq('course_code', courseCode.toUpperCase())
            .single();

          if (!error && data) {
            setMemoryCache(cacheKey, data, 600);
            return data;
          }
        }
      } catch (err) {
        console.warn('Supabase query error for curriculum, falling back to Firestore:', err);
      }
    }

    // Fallback: Firestore
    const app = getAdminApp();
    if (!app) return null;

    try {
      const snap = await app.firestore().collection('curriculum').where('courseCode', '==', courseCode.toUpperCase()).limit(1).get();
      if (snap.empty) return null;
      const doc = snap.docs[0];
      const data = { id: doc.id, ...doc.data() };
      setMemoryCache(cacheKey, data, 600);
      return data;
    } catch (err) {
      console.error('Firestore query error for curriculum:', err);
      return null;
    }
  }

  /**
   * Fetch Past Papers by Course Code
   */
  static async getPastPapers(filter: PastPaperFilter): Promise<any[]> {
    const cacheKey = `academic_pastpapers_${filter.courseCode.toUpperCase()}_${filter.year || 'all'}`;
    const cached = getMemoryCache<any[]>(cacheKey);
    if (cached) return cached;

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          let query = supabase.from('past_papers').select('*').eq('course_code', filter.courseCode.toUpperCase());
          if (filter.year) query = query.eq('year', filter.year);
          if (filter.semester) query = query.eq('semester', filter.semester);
          query = query.limit(filter.limit || 20);

          const { data, error } = await query;
          if (!error && data) {
            setMemoryCache(cacheKey, data, 300);
            return data;
          }
        }
      } catch (err) {
        console.warn('Supabase query error for past_papers, falling back to Firestore:', err);
      }
    }

    // Fallback: Firestore
    const app = getAdminApp();
    if (!app) return [];

    try {
      let ref: FirebaseFirestore.Query = app.firestore().collection('past_papers').where('courseCode', '==', filter.courseCode.toUpperCase());
      if (filter.year) ref = ref.where('year', '==', Number(filter.year));
      ref = ref.limit(filter.limit || 20);

      const snap = await ref.get();
      const papers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMemoryCache(cacheKey, papers, 300);
      return papers;
    } catch (err) {
      console.error('Firestore query error for past_papers:', err);
      return [];
    }
  }

  /**
   * Fetch Question Bank
   */
  static async getQuestionBank(filter: QuestionBankFilter): Promise<any[]> {
    const cacheKey = `academic_qb_${filter.courseCode.toUpperCase()}_${filter.topic || 'all'}_${filter.limit || 20}`;
    const cached = getMemoryCache<any[]>(cacheKey);
    if (cached) return cached;

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          let query = supabase.from('question_bank').select('*').eq('course_code', filter.courseCode.toUpperCase());
          if (filter.topic) query = query.eq('topic', filter.topic);
          if (filter.difficulty) query = query.eq('difficulty', filter.difficulty);
          query = query.limit(filter.limit || 50);

          const { data, error } = await query;
          if (!error && data) {
            setMemoryCache(cacheKey, data, 300);
            return data;
          }
        }
      } catch (err) {
        console.warn('Supabase query error for question_bank, falling back to Firestore:', err);
      }
    }

    // Fallback: Firestore
    const app = getAdminApp();
    if (!app) return [];

    try {
      let ref: FirebaseFirestore.Query = app.firestore().collection('question_bank').where('courseCode', '==', filter.courseCode.toUpperCase());
      if (filter.topic) ref = ref.where('topic', '==', filter.topic);
      ref = ref.limit(filter.limit || 50);

      const snap = await ref.get();
      const questions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMemoryCache(cacheKey, questions, 300);
      return questions;
    } catch (err) {
      console.error('Firestore query error for question_bank:', err);
      return [];
    }
  }

  /**
   * Sync / Save Question to both stores (or primary active store)
   */
  static async upsertQuestion(questionData: any): Promise<void> {
    const app = getAdminApp();
    if (app) {
      const docId = questionData.id || `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await app.firestore().collection('question_bank').doc(docId).set({
        ...questionData,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.from('question_bank').upsert({
            id: questionData.id,
            course_code: questionData.courseCode,
            topic: questionData.topic,
            difficulty: questionData.difficulty || 'medium',
            question: questionData.question,
            options: questionData.options || [],
            correct_answer: questionData.correctAnswer,
            explanation: questionData.explanation,
            blooms_taxonomy: questionData.bloomsTaxonomy || 'Understanding',
            tags: questionData.tags || [],
            updated_at: new Date().toISOString()
          });
        }
      } catch (err) {
        console.warn('Failed to upsert question to Supabase:', err);
      }
    }
  }
}
