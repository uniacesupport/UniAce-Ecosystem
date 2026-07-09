import { z } from 'zod';

// 1. Quiz Question Schema
export const QuizQuestionSchema = z.object({
  id: z.string().optional().or(z.null()).transform((val) => val || `q-${Math.random().toString(36).substring(2, 11)}`),
  type: z.enum(['multiple-choice', 'fill-in-the-blank']).default('multiple-choice'),
  question: z.string().min(1, 'Question text cannot be empty'),
  options: z.array(z.string()).optional().default([]).transform((opts) => opts || []),
  correctAnswer: z.string().min(1, 'Correct answer cannot be empty'),
  explanation: z.string().optional().default(''),
  hint: z.string().optional().default(''),
  difficulty: z.number().int().min(1).max(5).optional().default(3),
});

export const QuizQuestionsResponseSchema = z.object({
  questions: z.array(QuizQuestionSchema)
});

// 2. Evaluate Written Answer Schema
export const EvaluateWrittenAnswerSchema = z.object({
  score: z.number().min(0).max(100).default(0),
  isCorrect: z.boolean().default(false),
  feedback: z.string().min(1, 'Feedback cannot be empty').default('Answer reviewed.'),
});

// 3. Quick Check Schema
export const QuickCheckSchema = z.object({
  id: z.string().optional().or(z.null()).transform((val) => val || `qc-${Math.random().toString(36).substring(2, 11)}`),
  type: z.literal('multiple-choice').default('multiple-choice'),
  question: z.string().min(1, 'Question text cannot be empty'),
  options: z.array(z.string()).min(2, 'Multiple-choice questions need at least 2 options').default([]),
  correctAnswer: z.string().min(1, 'Correct answer cannot be empty'),
  explanation: z.string().optional().default(''),
  hint: z.string().optional().default(''),
});

// 4. Flashcard Schema
export const FlashcardSchema = z.object({
  id: z.string().optional().or(z.null()).transform((val) => val || `fc-${Math.random().toString(36).substring(2, 11)}`),
  front: z.string().min(1, 'Front cannot be empty'),
  back: z.string().min(1, 'Back cannot be empty'),
  moduleId: z.string().optional().default(''),
  subTopicId: z.string().optional().default(''),
});

export const FlashcardsResponseSchema = z.object({
  flashcards: z.array(FlashcardSchema)
});

// 5. Daily Mission / Smart Recommendation Schema
export const RecommendationSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty'),
  reason: z.string().min(1, 'Reason cannot be empty'),
  moduleId: z.string().optional().default(''),
  subTopicId: z.string().optional().default(''),
  type: z.enum(['review', 'new', 'mastery']).default('review'),
});

// 6. Exam Readiness Prediction Schema
export const ExamReadinessSchema = z.object({
  probability: z.number().min(0).max(100).default(50),
  analysis: z.string().min(1, 'Analysis cannot be empty').default('Review your topics to build confidence.'),
  weakestArea: z.string().optional().default('No major weak areas identified yet.'),
});

// 7. Study Plan Schedule Item Schema
export const StudyPlanTaskSchema = z.object({
  day: z.string().min(1, 'Day field cannot be empty'),
  focus: z.string().min(1, 'Focus field cannot be empty'),
  tasks: z.array(z.string()).min(1, 'Tasks array must contain at least one task').default([]),
});

// 8. Study Plan / Fast-Track Plan Schema
export const StudyPlanSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').default('Personalized Study Plan'),
  overview: z.string().min(1, 'Overview cannot be empty').default('Your structured academic path.'),
  dailySchedule: z.array(StudyPlanTaskSchema).default([]),
  tips: z.array(z.string()).default([]),
});

// 9. Booster Lesson Schema
export const BoosterLessonSchema = z.object({
  focus: z.string().min(1, 'Focus cannot be empty').default('Foundational Review'),
  tasks: z.array(z.string()).min(1, 'Tasks cannot be empty').default([
    'Review foundational concepts',
    'Attempt a simple practice problem',
    'Re-assess understanding with a quick concept check'
  ]),
});

/**
 * Robustly parses and validates any JSON payload against a Zod schema.
 * Logs validation failures but returns a valid typed object reconstructed with defaults where possible.
 */
export function safeParseAIResponse<T>(
  schema: z.ZodSchema<T>,
  data: any,
  fallback: T
): T {
  if (!data) return fallback;

  // Try standard parsing
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }

  console.warn('AI Zod validation failed, attempting partial recovery:', result.error.format());

  // Attempt partial array recovery for arrays of items (filtering out bad ones instead of failing all)
  if (Array.isArray(data) && (schema instanceof z.ZodArray || (schema as any)._def?.typeName === 'ZodArray')) {
    const itemSchema = (schema as any).element || (schema as any)._def?.type;
    if (itemSchema) {
      const parsedItems = data
        .map((item) => {
          const itemResult = itemSchema.safeParse(item);
          return itemResult.success ? itemResult.data : null;
        })
        .filter((item): item is any => item !== null);

      if (parsedItems.length > 0) {
        return parsedItems as unknown as T;
      }
    }
  }

  // Attempt recovery for objects containing arrays of items (like { questions: [...] } or { flashcards: [...] })
  if (data && typeof data === 'object') {
    const keys = Object.keys(data);
    for (const key of keys) {
      const val = data[key];
      if (Array.isArray(val)) {
        // If the target schema expects an object with an array key (e.g. QuizQuestionsResponseSchema)
        const shape = (schema as any).shape;
        if (shape && shape[key]) {
          const fieldSchema = shape[key];
          const elementSchema = fieldSchema.element || fieldSchema._def?.type;
          if (elementSchema) {
            const parsedItems = val
              .map((item) => {
                const itemResult = elementSchema.safeParse(item);
                return itemResult.success ? itemResult.data : null;
              })
              .filter((item): item is any => item !== null);

            if (parsedItems.length > 0) {
              return { [key]: parsedItems } as unknown as T;
            }
          }
        }
      }
    }
  }

  return fallback;
}
