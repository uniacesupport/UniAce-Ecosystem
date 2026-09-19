import { pgTable, varchar, text, integer, timestamp, jsonb, index, boolean } from 'drizzle-orm/pg-core';

/**
 * Option B: Supabase PostgreSQL Schema Definition (via Drizzle ORM)
 * Read-Heavy Educational Data Structures:
 * - departments
 * - courses
 * - curriculum
 * - past_papers
 * - question_bank
 */

// 1. Departments Table
export const departments = pgTable('departments', {
  id: varchar('id', { length: 128 }).primaryKey(),
  code: varchar('code', { length: 64 }).notNull().unique(),
  name: text('name').notNull(),
  faculty: text('faculty').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Courses Table
export const courses = pgTable('courses', {
  id: varchar('id', { length: 128 }).primaryKey(),
  code: varchar('code', { length: 64 }).notNull().unique(),
  title: text('title').notNull(),
  departmentId: varchar('department_id', { length: 128 }).references(() => departments.id),
  level: integer('level').notNull().default(100),
  semester: varchar('semester', { length: 32 }).notNull().default('First'),
  creditUnits: integer('credit_units').notNull().default(3),
  description: text('description'),
  isVerified: boolean('is_verified').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ([
  index('idx_courses_dept').on(table.departmentId),
  index('idx_courses_level').on(table.level),
  index('idx_courses_code').on(table.code),
]));

// 3. Curriculum Table
export const curriculum = pgTable('curriculum', {
  id: varchar('id', { length: 128 }).primaryKey(),
  courseCode: varchar('course_code', { length: 64 }).notNull().references(() => courses.code),
  title: text('title').notNull(),
  syllabus: text('syllabus'),
  learningObjectives: jsonb('learning_objectives').$type<string[]>().default([]),
  modules: jsonb('modules').$type<Array<{
    id: string;
    title: string;
    description: string;
    topics: string[];
  }>>().default([]),
  prerequisites: jsonb('prerequisites').$type<string[]>().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ([
  index('idx_curriculum_course_code').on(table.courseCode),
]));

// 4. Past Papers Table
export const pastPapers = pgTable('past_papers', {
  id: varchar('id', { length: 128 }).primaryKey(),
  courseCode: varchar('course_code', { length: 64 }).notNull(),
  courseTitle: text('course_title').notNull(),
  year: integer('year').notNull(),
  semester: varchar('semester', { length: 32 }).notNull(),
  examType: varchar('exam_type', { length: 64 }).notNull().default('Final'),
  questions: jsonb('questions').$type<Array<{
    number: number;
    questionText: string;
    marks?: number;
    options?: string[];
    correctAnswer?: string;
    explanation?: string;
  }>>().default([]),
  pdfUrl: text('pdf_url'),
  solutionGuide: jsonb('solution_guide').$type<Record<string, any>>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ([
  index('idx_past_papers_course_year').on(table.courseCode, table.year),
  index('idx_past_papers_course_code').on(table.courseCode),
]));

// 5. Question Bank Table
export const questionBank = pgTable('question_bank', {
  id: varchar('id', { length: 128 }).primaryKey(),
  courseCode: varchar('course_code', { length: 64 }).notNull(),
  topic: text('topic').notNull(),
  difficulty: varchar('difficulty', { length: 32 }).notNull().default('medium'),
  question: text('question').notNull(),
  options: jsonb('options').$type<string[]>().notNull().default([]),
  correctAnswer: text('correct_answer').notNull(),
  explanation: text('explanation'),
  bloomsTaxonomy: varchar('blooms_taxonomy', { length: 64 }).default('Understanding'),
  tags: jsonb('tags').$type<string[]>().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ([
  index('idx_qb_course_topic').on(table.courseCode, table.topic),
  index('idx_qb_difficulty').on(table.difficulty),
]));
