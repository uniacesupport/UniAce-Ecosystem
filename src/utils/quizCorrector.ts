import { Quiz, QuizQuestion } from '../types';

export function patchQuizQuestion(q: QuizQuestion): QuizQuestion {
  if (!q) return q;

  const patched = { ...q };

  // 1. Correct "horizontal asymptote at y = 3" error
  const questionText = patched.question || '';
  if (
    questionText.toLowerCase().includes('horizontal asymptote') &&
    (questionText.includes('3') || questionText.includes('y = 3'))
  ) {
    if (patched.options && patched.options.length > 0) {
      const hasFxFraction = patched.options.some(opt => opt.includes('3x') && opt.includes('2x') && opt.includes('x-1'));
      const hasExPlusThree = patched.options.some(opt => opt.includes('e^x') && opt.includes('3'));
      
      if (hasFxFraction && hasExPlusThree) {
        const correctOpt = patched.options.find(opt => opt.includes('e^x') && opt.includes('3'));
        if (correctOpt) {
          patched.correctAnswer = correctOpt;
          patched.explanation = `**The horizontal asymptote of a rational function $P(x)/Q(x)$ is determined by comparing the degrees of the numerator and denominator:**
- If $\\text{Degree}(P) < \\text{Degree}(Q)$, the horizontal asymptote is $y = 0$.
- If $\\text{Degree}(P) = \\text{Degree}(Q)$, the horizontal asymptote is at the ratio of leading coefficients (i.e., $y = a_n / b_m$).
- If $\\text{Degree}(P) > \\text{Degree}(Q)$, there is **no horizontal asymptote** (if the degree of $P$ is greater by exactly 1, there is a slant asymptote instead, and if greater by more than 1, a curved asymptote).

For $f(x) = \\frac{3x^2+2x}{x-1}$, the degree of the numerator is 2, and the degree of the denominator is 1. Since $\\text{Degree}(P) > \\text{Degree}(Q)$, there is NO horizontal asymptote; instead, f(x) has a slant asymptote at $y = 3x + 5$.

For $h(x) = e^x + 3$, as $x \\to -\\infty$, $e^x \\to 0$, which means $h(x) \\to 0 + 3 = 3$. Therefore, $y = 3$ is a true horizontal asymptote for $h(x) = e^x + 3$. This is the mathematically correct answer.`;
        }
      }
    }
  }

  // 2. Correct the domain of "1/x + sqrt(x-4)" error
  if (
    (questionText.includes('1/x') || questionText.includes('\\frac{1}{x}')) &&
    (questionText.includes('x-4') || questionText.includes('\\sqrt{x-4}') || questionText.includes('x - 4'))
  ) {
    if (patched.options && patched.options.length > 0) {
      const hasClosedFour = patched.options.find(opt => opt.includes('[4') && opt.includes('\\infty'));
      const hasOpenFour = patched.options.find(opt => opt.includes('(4') && opt.includes('\\infty'));
      
      if (hasClosedFour && hasOpenFour) {
        patched.correctAnswer = hasClosedFour;
        patched.explanation = `**To find the domain of the function $f(x) = \\frac{1}{x} + \\sqrt{x-4}$, we examine each part's restriction:**
1. For $\\frac{1}{x}$, the expression is undefined only when the denominator is 0. Thus, we require $x \\neq 0$. This does NOT require $x > 0$. Any negative number (excluding 0) is perfectly valid for $\\frac{1}{x}$.
2. For $\\sqrt{x-4}$, the expression under the square root must be non-negative. Thus, we require $x - 4 \\geq 0$, which gives $x \\geq 4$.

Combining these two conditions using logical intersection (AND):
We need $x \\neq 0$ AND $x \\geq 4$.
Since any value of $x \\geq 4$ is strictly positive and therefore automatically non-zero, the $x \\neq 0$ restriction does not remove any values from the range $x \\geq 4$.
Thus, the combined domain is simply $x \\geq 4$, which in interval notation is the closed interval $[4, \\infty)$.

Note: $x = 4$ is a valid input, as $f(4) = \\frac{1}{4} + \\sqrt{4-4} = \\frac{1}{4} + 0 = \\frac{1}{4}$. Therefore, the interval must be closed at 4.`;
      }
    }
  }

  return patched;
}

export function patchQuiz(quiz: Quiz | null): Quiz | null {
  if (!quiz) return null;
  return {
    ...quiz,
    questions: Array.isArray(quiz.questions) ? quiz.questions.map(patchQuizQuestion) : []
  };
}
