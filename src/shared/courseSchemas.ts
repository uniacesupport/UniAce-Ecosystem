import { z } from 'zod';

/**
 * UniAce Shared Course Schema & Pedagogical Architecture
 * Strict Zero-Fallback Policy: Unified contract across server & client
 */

export const BloomLevelEnum = z.enum(['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']);
export type BloomLevel = z.infer<typeof BloomLevelEnum>;

export const LearningOutcomeSchema = z.object({
  outcome: z.string().min(1, 'Outcome text cannot be empty'),
  bloomLevel: BloomLevelEnum.optional().default('Understand')
});
export type LearningOutcome = z.infer<typeof LearningOutcomeSchema>;

export const DisciplinePedagogyTypeEnum = z.enum([
  'STEM_MATHEMATICAL',
  'HUMANITIES_LAW_ARTS',
  'SOCIAL_SCIENCES_BUSINESS',
  'BIOMEDICAL_LIFE_SCIENCES',
  'GENERAL_FOUNDATIONS'
]);
export type DisciplinePedagogyType = z.infer<typeof DisciplinePedagogyTypeEnum>;

export const DomainBriefSchema = z.object({
  primaryDomain: z.string().min(1),
  subDisciplines: z.array(z.string()).min(1),
  pedagogyType: DisciplinePedagogyTypeEnum.default('STEM_MATHEMATICAL'),
  courseLevelFramework: z.string().default('Undergraduate University Standard'),
  recommendedCreditHours: z.number().int().min(1).max(12).default(3),
  targetModuleCountRange: z.object({
    min: z.number().int().min(4),
    max: z.number().int().max(16)
  }).default({ min: 6, max: 10 }),
  canonicalCourseReferences: z.array(z.string()).min(1),
  foundationalAxioms: z.array(z.string()).min(1),
  coreCourseTopics: z.array(z.string()).min(6)
});
export type DomainBrief = z.infer<typeof DomainBriefSchema>;

export const CourseLessonOutlineSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  learningOutcomeIds: z.array(z.string()).optional().default([]),
  coreConcepts: z.array(z.string()).optional().default([])
});
export type CourseLessonOutline = z.infer<typeof CourseLessonOutlineSchema>;

export const CourseModuleOutlineSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  order: z.number().int().optional(),
  isFoundationModule: z.boolean().optional().default(false),
  topics: z.array(z.string()).optional(),
  lessonTitles: z.array(z.string()).optional(),
  lessons: z.array(CourseLessonOutlineSchema).optional(),
  quizTopics: z.array(z.string()).optional().default([]),
  learningOutcomeIds: z.array(z.string()).optional().default([])
});
export type CourseModuleOutline = z.infer<typeof CourseModuleOutlineSchema>;

export const CourseSkeletonSchema = z.object({
  pedagogicalReasoning: z.string().optional(),
  description: z.string().min(1),
  pedagogyType: DisciplinePedagogyTypeEnum.optional().default('STEM_MATHEMATICAL'),
  creditHours: z.number().int().min(1).max(12).optional().default(3),
  learningOutcomes: z.array(LearningOutcomeSchema).min(3),
  modules: z.array(CourseModuleOutlineSchema).min(4)
});
export type CourseSkeleton = z.infer<typeof CourseSkeletonSchema>;

export const OutlineCriticRubricSchema = z.object({
  isValid: z.boolean(),
  coverageScore: z.number().min(0).max(100),
  consistencyScore: z.number().min(0).max(100).default(90),
  foundationsScore: z.number().min(0).max(100),
  workloadBalanceScore: z.number().min(0).max(100),
  sequencingScore: z.number().min(0).max(100),
  coveredTopics: z.array(z.string()),
  missingTopics: z.array(z.string()).default([]),
  sequencingErrors: z.array(z.string()).default([]),
  genericFillerDetected: z.boolean().default(false),
  confidenceState: z.enum(['verified', 'needs_review', 'failed']).default('verified'),
  reasoning: z.string()
});
export type OutlineCriticRubric = z.infer<typeof OutlineCriticRubricSchema>;

export const LessonContentSchema = z.preprocess((val) => {
  if (typeof val === 'string') {
    return { title: 'Lesson', content: val };
  }
  return val;
}, z.object({
  pedagogicalReasoning: z.string().optional(),
  title: z.string().optional(),
  content: z.string().min(100, 'Lesson content must be comprehensive (at least 100 characters).')
}));
export type LessonContent = z.infer<typeof LessonContentSchema>;

export const CourseProvenanceSchema = z.object({
  sources: z.array(z.string()).default([]),
  modelVersion: z.string().default('gemini-2.5-pro'),
  promptVersion: z.string().default('uniace-curriculum-v2.0'),
  generatedAt: z.string(),
  groundingScore: z.number().optional().default(95),
  rubricAudit: OutlineCriticRubricSchema.optional()
});
export type CourseProvenance = z.infer<typeof CourseProvenanceSchema>;

/**
 * Normalizes any variation of objectives or learning outcomes into a clean LearningOutcome array
 */
export function normalizeLearningOutcomes(raw: any): LearningOutcome[] {
  if (!raw) return [];
  if (!Array.isArray(raw)) return [];
  return raw.map((item: any) => {
    if (typeof item === 'string') {
      return { outcome: item.trim(), bloomLevel: 'Understand' as BloomLevel };
    }
    if (item && typeof item === 'object') {
      const outcome = item.outcome || item.title || item.description || item.text || '';
      let bloomLevel: BloomLevel = 'Understand';
      if (item.bloomLevel && ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'].includes(item.bloomLevel)) {
        bloomLevel = item.bloomLevel as BloomLevel;
      }
      return { outcome: String(outcome).trim(), bloomLevel };
    }
    return { outcome: String(item).trim(), bloomLevel: 'Understand' as BloomLevel };
  }).filter(o => o.outcome.length > 0);
}

/**
 * Helper to derive curriculum parameters based on level, term, and credits
 */
export function deriveCurriculumParameters(level?: string, semester?: string, creditUnits?: number, depth?: string) {
  const credits = creditUnits && creditUnits > 0 ? creditUnits : 3;
  let minModules = 6;
  let maxModules = 10;
  let targetLessonsPerModule = 4;

  const normalizedLevel = (level || '').toLowerCase();
  if (normalizedLevel.includes('100') || normalizedLevel.includes('intro') || normalizedLevel.includes('first')) {
    // 100 level: Broad foundational breadth, thorough orientation
    minModules = Math.max(6, Math.min(10, credits * 2));
    maxModules = minModules + 2;
    targetLessonsPerModule = 4;
  } else if (normalizedLevel.includes('400') || normalizedLevel.includes('500') || normalizedLevel.includes('grad') || normalizedLevel.includes('advanced')) {
    // Advanced level: Deep specialized thematic modules
    minModules = Math.max(6, Math.min(12, credits * 2 + 1));
    maxModules = minModules + 2;
    targetLessonsPerModule = 4;
  } else {
    // 200-300 level: Core intermediate progression
    minModules = Math.max(6, Math.min(10, credits * 2));
    maxModules = minModules + 2;
    targetLessonsPerModule = 4;
  }

  if (depth === 'in-depth' || depth === 'advanced') {
    minModules += 1;
    maxModules += 2;
  }

  return {
    credits,
    minModules,
    maxModules,
    targetLessonsPerModule
  };
}
