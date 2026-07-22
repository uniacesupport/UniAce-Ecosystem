import { z } from 'zod';
import { safeParseAIResponse, QuizQuestionsResponseSchema } from './src/services/validators/aiSchemas';

const data = {
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "question": "According to Coulomb's Law, how does the magnitude of the electrostatic force between two point charges depend on the distance $ r $ between them?",
      "options": [
        "$ F \\propto r $",
        "$ F \\propto \\frac{1}{r} $",
        "$ F \\propto \\frac{1}{r^2} $",
        "$ F \\propto r^2 $"
      ],
      "correctAnswer": "$ F \\propto \\frac{1}{r^2} $",
      "explanation": "Coulomb's Law states $ F = k \\frac{q_1 q_2}{r^2} $, where $ F $ is inversely proportional to the square of the distance $ r $. This inverse-square relationship is fundamental to electrostatic force calculations.",
      "hint": "Recall the formula for Coulomb's Law and focus on the $ r $-term.",
      "difficulty": 7.5
    }
  ]
};

const validated = safeParseAIResponse(
  QuizQuestionsResponseSchema,
  data,
  { questions: [] }
);

console.log(validated);
