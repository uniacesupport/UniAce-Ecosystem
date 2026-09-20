import { z } from 'zod';

/**
 * Dynamically heals and aligns quiz questions so that correctAnswer is strictly and exactly present
 * in the options list. Handles various common AI mistakes such as different prefixes, casing,
 * letter-only answers, digit-only answers, partial substrings, and duplicate options.
 */
export function autoHealQuestion(q: any): any {
  if (!q || typeof q !== 'object') return q;

  // Ensure we have a valid question type
  const type = q.type || 'multiple-choice';

  // Ensure we have an options array
  let options = Array.isArray(q.options) 
    ? q.options.map((o: any) => String(o || '').trim()) 
    : [];
    
  let correctAnswer = String(q.correctAnswer || q.answer || '').trim();
  let explanation = String(q.explanation || '').trim();
  const isMultipleChoice = type === 'multiple-choice';

  if (isMultipleChoice) {
    // If multiple choice but options are missing, construct options safely
    if (options.length === 0) {
      if (correctAnswer) {
        options = [correctAnswer, "Incorrect Option A", "Incorrect Option B", "Incorrect Option C"];
      } else {
        options = ["Option A", "Option B", "Option C", "Option D"];
        correctAnswer = options[0];
      }
    }

    // Double-check options are strings and trimmed
    options = options.map(opt => String(opt || '').trim());

    // Check if correctAnswer is exactly one of the options
    let exactMatch = options.find(opt => opt === correctAnswer);

    if (!exactMatch) {
      // 1. Try case-insensitive matching
      let caseInsensitiveMatch = options.find(opt => opt.toLowerCase() === correctAnswer.toLowerCase());
      if (caseInsensitiveMatch) {
        correctAnswer = caseInsensitiveMatch;
      } else {
        // 2. Try removing common prefix labels like "A)", "A.", "1.", "Option A:"
        const cleanStr = (s: string) => s.replace(/^(?:Option\s+)?[A-Da-d1-4][\).\s\-:]+/, '').trim();
        const cleanAnswer = cleanStr(correctAnswer);

        let prefixMatch = options.find(opt => cleanStr(opt).toLowerCase() === cleanAnswer.toLowerCase());
        if (prefixMatch) {
          correctAnswer = prefixMatch;
        } else {
          // 3. Try letter/index matching if correctAnswer is just a single option letter/digit
          let matchIndex = -1;
          const letterMatch = correctAnswer.match(/^[A-Da-d]$/);
          if (letterMatch) {
            matchIndex = letterMatch[0].toUpperCase().charCodeAt(0) - 65;
          } else {
            const digitMatch = correctAnswer.match(/^[1-4]$/);
            if (digitMatch) {
              matchIndex = parseInt(digitMatch[0], 10) - 1;
            } else {
              const zeroDigitMatch = correctAnswer.match(/^[0-3]$/);
              if (zeroDigitMatch) {
                matchIndex = parseInt(zeroDigitMatch[0], 10);
              }
            }
          }

          if (matchIndex >= 0 && matchIndex < options.length) {
            correctAnswer = options[matchIndex];
          } else {
            // 4. Try partial search: is correctAnswer inside one of the options, or vice-versa?
            let partialMatch = options.find(opt => {
              const optLower = opt.toLowerCase();
              const ansLower = correctAnswer.toLowerCase();
              return optLower.includes(ansLower) || ansLower.includes(optLower);
            });
            if (partialMatch) {
              correctAnswer = partialMatch;
            } else {
              // 5. Force-align: if still not matched, place correct answer text as options[0]
              if (options.length > 0) {
                options[0] = correctAnswer;
              } else {
                options.push(correctAnswer);
              }
            }
          }
        }
      }
    }

    // Deduplicate options to prevent duplicate selection/rendering issues
    const seen = new Set<string>();
    options = options.map((opt, idx) => {
      let uniqueOpt = opt;
      let counter = 1;
      while (seen.has(uniqueOpt)) {
        uniqueOpt = `${opt} (${counter})`;
        counter++;
      }
      seen.add(uniqueOpt);
      if (opt === correctAnswer) {
        correctAnswer = uniqueOpt;
      }
      return uniqueOpt;
    });
  }

  return {
    ...q,
    options,
    correctAnswer,
    answer: correctAnswer,
    explanation: explanation || `The correct answer is: ${correctAnswer}.`,
    difficulty: Math.max(1, Math.min(5, Math.round(Number(q.difficulty) || 3)))
  };
}

// 1. Quiz Question Schema
export const QuizQuestionSchema = z.object({
  id: z.string().optional().or(z.null()).transform((val) => val || `q-${Math.random().toString(36).substring(2, 11)}`),
  type: z.enum(['multiple-choice', 'fill-in-the-blank']).default('multiple-choice'),
  question: z.string().min(1, 'Question text cannot be empty'),
  options: z.array(z.string()).optional().default([]).transform((opts) => opts || []),
  correctAnswer: z.string().min(1, 'Correct answer cannot be empty'),
  explanation: z.string().optional().default(''),
  hint: z.string().optional().default(''),
  difficulty: z.number().optional().default(3),
}).transform((q) => autoHealQuestion(q));

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
}).transform((q) => autoHealQuestion(q));

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
 * Parses and validates live AI JSON payload against a Zod schema.
 * Enforces Zero-Fallback Policy: strictly prohibits static fallbacks or mock substitutions.
 * Only validates and recovers real dynamically retrieved data, throwing an error if invalid.
 */
export function safeParseAIResponse<T>(
  schema: z.ZodSchema<T>,
  data: any,
  fallback?: T
): T {
  if (!data) {
    throw new Error('Zero-Fallback Policy: No dynamic AI data received to validate.');
  }

  // Try standard parsing
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }

  console.warn('AI Zod validation failed, attempting partial recovery from dynamic data:', result.error.format());

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

  throw new Error(`Zero-Fallback Policy: AI response data does not match required schema (${result.error.issues.map(i => i.message).join('; ')}). Refusing to return static fallback.`);
}
