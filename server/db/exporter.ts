import { getAdminApp } from '../firebaseAdmin';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

export interface MigrationSummary {
  departmentsExported: number;
  coursesExported: number;
  curriculumExported: number;
  pastPapersExported: number;
  questionBankExported: number;
  timestamp: string;
  destination: 'supabase' | 'json_snapshot';
  errors: string[];
}

/**
 * Service to export static educational data from Firestore to Supabase Postgres
 */
export async function exportFirestoreToSupabase(): Promise<MigrationSummary> {
  const summary: MigrationSummary = {
    departmentsExported: 0,
    coursesExported: 0,
    curriculumExported: 0,
    pastPapersExported: 0,
    questionBankExported: 0,
    timestamp: new Date().toISOString(),
    destination: isSupabaseConfigured() ? 'supabase' : 'json_snapshot',
    errors: [],
  };

  const app = getAdminApp();
  if (!app) {
    summary.errors.push('Firebase Admin SDK is not initialized.');
    return summary;
  }

  const db = app.firestore();
  const supabase = getSupabaseClient();

  // 1. Export Departments
  try {
    const deptSnap = await db.collection('departments').get();
    const deptList = deptSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        code: data.code || doc.id,
        name: data.name || data.code,
        faculty: data.faculty || 'General Sciences',
        description: data.description || null,
        created_at: data.createdAt || new Date().toISOString(),
        updated_at: data.updatedAt || new Date().toISOString(),
      };
    });

    summary.departmentsExported = deptList.length;

    if (supabase && deptList.length > 0) {
      const { error } = await supabase.from('departments').upsert(deptList);
      if (error) summary.errors.push(`Departments Supabase error: ${error.message}`);
    }
  } catch (err) {
    summary.errors.push(`Departments export error: ${(err as Error).message}`);
  }

  // 2. Export Courses
  try {
    const courseSnap = await db.collection('courses').get();
    const courseList = courseSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        code: data.code || doc.id,
        title: data.title || data.name || 'Untitled Course',
        department_id: data.departmentId || null,
        level: Number(data.level || 100),
        semester: data.semester || 'First',
        credit_units: Number(data.creditUnits || 3),
        description: data.description || null,
        is_verified: data.isVerified !== false,
        created_at: data.createdAt || new Date().toISOString(),
        updated_at: data.updatedAt || new Date().toISOString(),
      };
    });

    summary.coursesExported = courseList.length;

    if (supabase && courseList.length > 0) {
      const { error } = await supabase.from('courses').upsert(courseList);
      if (error) summary.errors.push(`Courses Supabase error: ${error.message}`);
    }
  } catch (err) {
    summary.errors.push(`Courses export error: ${(err as Error).message}`);
  }

  // 3. Export Curriculum
  try {
    const currSnap = await db.collection('curriculum').get();
    const currList = currSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        course_code: data.courseCode || 'UNKNOWN',
        title: data.title || 'Course Curriculum',
        syllabus: data.syllabus || '',
        learning_objectives: data.learningObjectives || [],
        modules: data.modules || [],
        prerequisites: data.prerequisites || [],
        created_at: data.createdAt || new Date().toISOString(),
        updated_at: data.updatedAt || new Date().toISOString(),
      };
    });

    summary.curriculumExported = currList.length;

    if (supabase && currList.length > 0) {
      const { error } = await supabase.from('curriculum').upsert(currList);
      if (error) summary.errors.push(`Curriculum Supabase error: ${error.message}`);
    }
  } catch (err) {
    summary.errors.push(`Curriculum export error: ${(err as Error).message}`);
  }

  // 4. Export Past Papers
  try {
    const paperSnap = await db.collection('past_papers').get();
    const paperList = paperSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        course_code: data.courseCode || 'UNKNOWN',
        course_title: data.courseTitle || 'Past Examination',
        year: Number(data.year || new Date().getFullYear()),
        semester: data.semester || 'First',
        exam_type: data.examType || 'Final',
        questions: data.questions || [],
        pdf_url: data.pdfUrl || null,
        solution_guide: data.solutionGuide || {},
        created_at: data.createdAt || new Date().toISOString(),
        updated_at: data.updatedAt || new Date().toISOString(),
      };
    });

    summary.pastPapersExported = paperList.length;

    if (supabase && paperList.length > 0) {
      const { error } = await supabase.from('past_papers').upsert(paperList);
      if (error) summary.errors.push(`Past Papers Supabase error: ${error.message}`);
    }
  } catch (err) {
    summary.errors.push(`Past Papers export error: ${(err as Error).message}`);
  }

  // 5. Export Question Bank
  try {
    const qbSnap = await db.collection('question_bank').get();
    const qbList = qbSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        course_code: data.courseCode || 'UNKNOWN',
        topic: data.topic || 'General',
        difficulty: data.difficulty || 'medium',
        question: data.question || '',
        options: data.options || [],
        correct_answer: data.correctAnswer || '',
        explanation: data.explanation || '',
        blooms_taxonomy: data.bloomsTaxonomy || 'Understanding',
        tags: data.tags || [],
        created_at: data.createdAt || new Date().toISOString(),
        updated_at: data.updatedAt || new Date().toISOString(),
      };
    });

    summary.questionBankExported = qbList.length;

    if (supabase && qbList.length > 0) {
      const { error } = await supabase.from('question_bank').upsert(qbList);
      if (error) summary.errors.push(`Question Bank Supabase error: ${error.message}`);
    }
  } catch (err) {
    summary.errors.push(`Question Bank export error: ${(err as Error).message}`);
  }

  return summary;
}
