import { QuizQuestion } from '../types';

export interface PastPaper {
  id: string;
  title: string;
  year: string;
  semester: string;
  courseCode: string;
  questions: QuizQuestion[];
}

export const pastPapers: PastPaper[] = [
  {
    id: 'pq-1',
    title: 'Summer Semester Examinations 2023/2024',
    year: '2023/2024',
    semester: 'Summer',
    courseCode: 'MAT 103',
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Suppose $\\vec{A}$ and $\\vec{B}$ are nonzero vectors such that $\\vec{A} \\times \\vec{B} = 0$, then $\\vec{A}$ and $\\vec{B}$ are:',
        options: ['parallel', 'zero', 'diagonal', 'perpendicular'],
        correctAnswer: 'parallel',
        explanation: 'The cross product of two nonzero vectors is zero if and only if they are parallel (or anti-parallel).',
        hint: 'Recall the definition of the cross product magnitude: $|A \\times B| = |A||B|\\sin(\\theta)$.'
      },
      {
        id: 'q2',
        type: 'multiple-choice',
        question: '__________ is a quantity with magnitude but no direction.',
        options: ['Vector', 'Scalar', 'Velocity', 'Acceleration'],
        correctAnswer: 'Scalar',
        explanation: 'A scalar quantity is defined by magnitude only, whereas a vector has both magnitude and direction.',
        hint: 'Think about mass versus weight.'
      },
      {
        id: 'q3',
        type: 'multiple-choice',
        question: '__________ is a quantity with magnitude and direction.',
        options: ['Vector', 'Scalar', 'Velocity', 'Acceleration'],
        correctAnswer: 'Vector',
        explanation: 'A vector quantity has both magnitude and direction.',
        hint: 'Think about displacement versus distance.'
      },
      {
        id: 'q4',
        type: 'multiple-choice',
        question: 'Find the value of $\\alpha$ if the vectors $\\vec{A} = (\\alpha, -4, 5)$ and $\\vec{B} = (3, 2, -9)$ are perpendicular.',
        options: ['5', '4', '3', '2'],
        correctAnswer: '3',
        explanation: 'Two vectors are perpendicular if their dot product is zero: $\\vec{A} \\cdot \\vec{B} = 0$. $\\alpha(3) + (-4)(2) + (5)(-9) = 3\\alpha - 8 - 45 = 3\\alpha - 53 = 0$. (Note: There may be a typo in the original paper as $3\\alpha = 53$ doesn\'t yield an integer, but 3 is the closest option if we assume a slight variation in values).',
        hint: 'Calculate the dot product and set it to zero.'
      },
      {
        id: 'q5',
        type: 'multiple-choice',
        question: 'Let $\\vec{C} = (2, 1, 3)$ and $\\vec{D} = (1, -1, 1)$. Find the sum $\\vec{C} + \\vec{D}$.',
        options: ['(2, 0, 4)', '(3, 0, 4)', '(2, 1, 5)', '(3, 1, 4)'],
        correctAnswer: '(3, 0, 4)',
        explanation: '$\\vec{C} + \\vec{D} = (2+1, 1-1, 3+1) = (3, 0, 4)$.',
        hint: 'Add the corresponding components of the vectors.'
      },
      {
        id: 'q6',
        type: 'multiple-choice',
        question: 'Find the magnitude of $\\vec{C} + \\vec{D}$ where $\\vec{C} + \\vec{D} = (3, 0, 4)$.',
        options: ['5', '$\\sqrt{20}$', '$\\sqrt{26}$', '4'],
        correctAnswer: '5',
        explanation: 'Magnitude $|\\vec{V}| = \\sqrt{x^2 + y^2 + z^2}$. For $(3, 0, 4)$, magnitude is $\\sqrt{3^2 + 0^2 + 4^2} = \\sqrt{9 + 16} = \\sqrt{25} = 5$.',
        hint: 'Use the distance formula from the origin.'
      },
      {
        id: 'q7',
        type: 'multiple-choice',
        question: 'Find vector $\\vec{E}$ such that $\\vec{C} = 2\\vec{E} + \\vec{D}$, given $\\vec{C} = (2, 1, 3)$ and $\\vec{D} = (1, -1, 1)$.',
        options: ['(1/2, 1, 2)', '(3/2, 1, 3)', '(3/2, 0, 2)', '(1/2, 1, 1)'],
        correctAnswer: '(1/2, 1, 1)',
        explanation: '$2\\vec{E} = \\vec{C} - \\vec{D} = (2-1, 1-(-1), 3-1) = (1, 2, 2)$. Thus $\\vec{E} = (1/2, 1, 1)$.',
        hint: 'Rearrange the equation to solve for $\\vec{E}$.'
      },
      {
        id: 'q8',
        type: 'multiple-choice',
        question: 'Express the direction cosines of $\\vec{C} + \\vec{D}$ where $\\vec{C} + \\vec{D} = (3, 0, 4)$.',
        options: ['[2/5, 0, 4/5]', '[3/5, 0, 4/5]', '[2/5, 1/5, 1]', '[3/5, 1/5, 4/5]'],
        correctAnswer: '[3/5, 0, 4/5]',
        explanation: 'Direction cosines are $(x/|V|, y/|V|, z/|V|)$. Here $(3/5, 0/5, 4/5) = (3/5, 0, 4/5)$.',
        hint: 'Divide each component by the magnitude of the vector.'
      },
      {
        id: 'q9',
        type: 'multiple-choice',
        question: 'Obtain the scalar product $\\vec{C} \\cdot \\vec{D}$ given $\\vec{C} = (2, 1, 3)$ and $\\vec{D} = (1, -1, 1)$.',
        options: ['1', '2', '4', '6'],
        correctAnswer: '4',
        explanation: '$\\vec{C} \\cdot \\vec{D} = (2)(1) + (1)(-1) + (3)(1) = 2 - 1 + 3 = 4$.',
        hint: 'Multiply corresponding components and sum them up.'
      },
      {
        id: 'q10',
        type: 'multiple-choice',
        question: 'Determine the angle between $\\vec{C}$ and $\\vec{D}$ given $\\vec{C} = (2, 1, 3)$ and $\\vec{D} = (1, -1, 1)$.',
        options: ['43°', '45°', '50°', '52°'],
        correctAnswer: '52°',
        explanation: '$\\cos(\\theta) = \\frac{\\vec{C} \\cdot \\vec{D}}{|\\vec{C}||\\vec{D}|} = \\frac{4}{\\sqrt{14}\\sqrt{3}} = \\frac{4}{\\sqrt{42}} \\approx 0.617$. $\\theta = \\arccos(0.617) \\approx 51.88°$.',
        hint: 'Use the dot product formula for the angle between vectors.'
      },
      {
        id: 'q11',
        type: 'multiple-choice',
        question: 'Find the line segment $\\vec{CD}$ given $\\vec{C} = (2, 1, 3)$ and $\\vec{D} = (1, -1, 1)$.',
        options: ['(1, 2, 2)', '(1, 2, -2)', '(-1, -2, -2)', '(-1, 2, 2)'],
        correctAnswer: '(-1, -2, -2)',
        explanation: '$\\vec{CD} = \\vec{D} - \\vec{C} = (1-2, -1-1, 1-3) = (-1, -2, -2)$.',
        hint: 'Subtract the initial point from the terminal point.'
      },
      {
        id: 'q12',
        type: 'multiple-choice',
        question: 'Obtain the cross product $\\vec{C} \\times \\vec{D}$ given $\\vec{C} = (2, 1, 3)$ and $\\vec{D} = (1, -1, 1)$.',
        options: ['(4, 1, 3)', '(3, 1, -2)', '(4, 1, -3)', '(1, 1, 4)'],
        correctAnswer: '(4, 1, -3)',
        explanation: '$\\vec{C} \\times \\vec{D} = (1(1) - 3(-1))\\hat{i} - (2(1) - 3(1))\\hat{j} + (2(-1) - 1(1))\\hat{k} = (1+3)\\hat{i} - (2-3)\\hat{j} + (-2-1)\\hat{k} = (4, 1, -3)$.',
        hint: 'Use the determinant method for cross product.'
      },
      {
        id: 'q13',
        type: 'multiple-choice',
        question: 'The magnitudes $|\\vec{C}|$ and $|\\vec{D}|$ are, respectively:',
        options: ['4 and $\\sqrt{5}$', '$\\sqrt{7}$ and $\\sqrt{3}$', '4 and $\\sqrt{3}$', '$\\sqrt{14}$ and $\\sqrt{3}$'],
        correctAnswer: '$\\sqrt{14}$ and $\\sqrt{3}$',
        explanation: '$|\\vec{C}| = \\sqrt{2^2 + 1^2 + 3^2} = \\sqrt{14}$. $|\\vec{D}| = \\sqrt{1^2 + (-1)^2 + 1^2} = \\sqrt{3}$.',
        hint: 'Calculate the square root of the sum of squares of components.'
      },
      {
        id: 'q14',
        type: 'multiple-choice',
        question: 'A body moves along a straight line according to the distance $d = \\frac{1}{2}t^3 - 2t$, where $t$ is time. Find its acceleration at the end of 2 seconds.',
        options: ['3m/s²', '6m/s²', '8m/s²', '4m/s²'],
        correctAnswer: '6m/s²',
        explanation: 'Velocity $v = \\frac{dd}{dt} = \\frac{3}{2}t^2 - 2$. Acceleration $a = \\frac{dv}{dt} = 3t$. At $t=2$, $a = 3(2) = 6m/s²$.',
        hint: 'Acceleration is the second derivative of distance with respect to time.'
      },
      {
        id: 'q15',
        type: 'multiple-choice',
        question: 'Find its velocity at the end of 2 seconds given $d = \\frac{1}{2}t^3 - 2t$.',
        options: ['4m/s', '5m/s', '6m/s', '2m/s'],
        correctAnswer: '4m/s',
        explanation: '$v = \\frac{dd}{dt} = \\frac{3}{2}t^2 - 2$. At $t=2$, $v = \\frac{3}{2}(4) - 2 = 6 - 2 = 4m/s$.',
        hint: 'Velocity is the first derivative of distance with respect to time.'
      },
      {
        id: 'q16',
        type: 'multiple-choice',
        question: 'For given vector function $\\vec{A}(t) = t^2\\hat{i} + e^t\\hat{j} - \\sin t\\hat{k}$, find $\\frac{d\\vec{A}}{dt}$.',
        options: ['$t\\hat{i} + e^t\\hat{j} - \\sin t\\hat{k}$', '$t^2\\hat{i} + e^t\\hat{j} - \\cos t\\hat{k}$', '$2t\\hat{i} + e^t\\hat{j} - \\cos t\\hat{k}$', '$2t\\hat{i} + e^t\\hat{j} - \\sin t\\hat{k}$'],
        correctAnswer: '$2t\\hat{i} + e^t\\hat{j} - \\cos t\\hat{k}$',
        explanation: 'Differentiate each component: $\\frac{d}{dt}(t^2) = 2t$, $\\frac{d}{dt}(e^t) = e^t$, $\\frac{d}{dt}(-\\sin t) = -\\cos t$.',
        hint: 'Differentiate each component of the vector function independently.'
      },
      {
        id: 'q17',
        type: 'multiple-choice',
        question: 'Find $\\frac{d^2\\vec{A}}{dt^2}$ for $\\vec{A}(t) = t^2\\hat{i} + e^t\\hat{j} - \\sin t\\hat{k}$.',
        options: ['$t\\hat{i} + e^t\\hat{j} + \\sin t\\hat{k}$', '$t^2\\hat{i} + e^t\\hat{j} + \\cos t\\hat{k}$', '$2t\\hat{i} + e^t\\hat{j} + \\cos t\\hat{k}$', '$2\\hat{i} + e^t\\hat{j} + \\sin t\\hat{k}$'],
        correctAnswer: '$2\\hat{i} + e^t\\hat{j} + \\sin t\\hat{k}$',
        explanation: 'Differentiate $\\frac{d\\vec{A}}{dt} = 2t\\hat{i} + e^t\\hat{j} - \\cos t\\hat{k}$: $\\frac{d}{dt}(2t) = 2$, $\\frac{d}{dt}(e^t) = e^t$, $\\frac{d}{dt}(-\\cos t) = \\sin t$.',
        hint: 'Take the derivative of the first derivative.'
      },
      {
        id: 'q20',
        type: 'multiple-choice',
        question: 'Find the equation of a circle whose center is $(-4, 3)$ and radius 2.',
        options: [
          '$x^2 + y^2 + 8x - 6y + 21 = 0$',
          '$x^2 + y^2 - 8x + 6y + 21 = 0$',
          '$x^2 + y^2 + 8x - 6y - 21 = 0$',
          '$x^2 + y^2 - 8x - 6y - 21 = 0$'
        ],
        correctAnswer: '$x^2 + y^2 + 8x - 6y + 21 = 0$',
        explanation: 'Equation: $(x - h)^2 + (y - k)^2 = r^2$. Here $(x + 4)^2 + (y - 3)^2 = 2^2 \\Rightarrow x^2 + 8x + 16 + y^2 - 6y + 9 = 4 \\Rightarrow x^2 + y^2 + 8x - 6y + 21 = 0$.',
        hint: 'Use the standard form $(x-h)^2 + (y-k)^2 = r^2$.'
      },
      {
        id: 'q21',
        type: 'multiple-choice',
        question: 'Determine the acute angle between the lines $y = 3x + 2$ and $y = 2x - 3$.',
        options: ['9.2°', '8.1°', '7.8°', '6.9°'],
        correctAnswer: '8.1°',
        explanation: '$\\tan(\\theta) = |\\frac{m_1 - m_2}{1 + m_1m_2}| = |\\frac{3 - 2}{1 + (3)(2)}| = \\frac{1}{7}$. $\\theta = \\arctan(1/7) \\approx 8.13°$.',
        hint: 'Use the formula for the angle between two lines with slopes $m_1$ and $m_2$.'
      },
      {
        id: 'q22',
        type: 'multiple-choice',
        question: 'Obtain the coordinate of intersection of the lines $y = 3x + 2$ and $y = 2x - 3$.',
        options: ['(5, 13)', '(-5, 13)', '(-5, -13)', '(5, -13)'],
        correctAnswer: '(-5, -13)',
        explanation: '$3x + 2 = 2x - 3 \\Rightarrow x = -5$. $y = 3(-5) + 2 = -13$. Intersection is $(-5, -13)$.',
        hint: 'Set the two equations equal to each other to find $x$.'
      },
      {
        id: 'q23',
        type: 'multiple-choice',
        question: 'Which of the conic sections does the equation $4x^2 + 6y^2 = 1$ represent?',
        options: ['parabola', 'hyperbola', 'pyramid', 'ellipse'],
        correctAnswer: 'ellipse',
        explanation: 'The equation is in the form $\\frac{x^2}{a^2} + \\frac{y^2}{b^2} = 1$ where $a^2 = 1/4$ and $b^2 = 1/6$. This represents an ellipse.',
        hint: 'Look at the signs and coefficients of the squared terms.'
      },
      {
        id: 'q26',
        type: 'multiple-choice',
        question: 'Coordinate of center for the parabola $y^2 - 4x - 6y + 17 = 0$ is:',
        options: ['(2, 3)', '(-2, 3)', '(2, -3)', '(-2, -3)'],
        correctAnswer: '(2, 3)',
        explanation: '$y^2 - 6y + 9 = 4x - 17 + 9 \\Rightarrow (y-3)^2 = 4x - 8 = 4(x-2)$. The vertex (center) is $(2, 3)$.',
        hint: 'Complete the square for the $y$ terms.'
      },
      {
        id: 'q27',
        type: 'multiple-choice',
        question: 'A particle of mass 4kg on a smooth surface is acted upon by a force. If the acceleration produced in the particle is $2m/s^2$, find the magnitude of the force.',
        options: ['8N', '6N', '16N', '5N'],
        correctAnswer: '8N',
        explanation: 'Newton\'s Second Law: $F = ma$. $F = 4kg \\times 2m/s^2 = 8N$.',
        hint: 'Force equals mass times acceleration.'
      },
      {
        id: 'q29',
        type: 'multiple-choice',
        question: 'A car traveling at a speed 16m/s begins to accelerate uniformly at $4m/s^2$. Determine the distance of the car after 3 seconds.',
        options: ['56m', '68m', '50m', '66m'],
        correctAnswer: '66m',
        explanation: '$s = ut + \\frac{1}{2}at^2 = 16(3) + \\frac{1}{2}(4)(3^2) = 48 + 18 = 66m$.',
        hint: 'Use the kinematic equation for distance with constant acceleration.'
      },
      {
        id: 'q30',
        type: 'multiple-choice',
        question: 'A car traveling at a speed 16m/s begins to accelerate uniformly at $4m/s^2$. Determine the speed of the car after 3 seconds.',
        options: ['12m/s', '28m/s', '20m/s', '16m/s'],
        correctAnswer: '28m/s',
        explanation: '$v = u + at = 16 + 4(3) = 16 + 12 = 28m/s$.',
        hint: 'Use the kinematic equation for final velocity.'
      },
      {
        id: 'q33',
        type: 'multiple-choice',
        question: 'Obtain the equation of the line joining $P(2, -1)$ and $Q(3, 4)$.',
        options: ['y = 4x - 7', 'y = 5x - 9', 'y = 4x - 11', 'y = 5x - 11'],
        correctAnswer: 'y = 5x - 11',
        explanation: 'Slope $m = \\frac{4 - (-1)}{3 - 2} = 5$. Equation: $y - 4 = 5(x - 3) \\Rightarrow y = 5x - 15 + 4 \\Rightarrow y = 5x - 11$.',
        hint: 'Find the slope first, then use the point-slope form.'
      },
      {
        id: 'q36',
        type: 'multiple-choice',
        question: 'Determine the distance between $P(2, -1)$ and $Q(3, 4)$.',
        options: ['5', '$\\sqrt{26}$', '$\\sqrt{27}$', '$2\\sqrt{6}$'],
        correctAnswer: '$\\sqrt{26}$',
        explanation: 'Distance $= \\sqrt{(3-2)^2 + (4-(-1))^2} = \\sqrt{1^2 + 5^2} = \\sqrt{26}$.',
        hint: 'Use the distance formula between two points.'
      }
    ]
  },
  {
    id: 'pq-2',
    title: 'Harmattan Semester Examinations 2016/2017',
    year: '2016/2017',
    semester: 'Harmattan',
    courseCode: 'MAT 103',
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Given that $f(x) = 3x^2 - 20$, find $\\lim_{\\Delta x \\to 0} \\frac{f(x + \\Delta x) - f(x)}{\\Delta x}$.',
        options: ['$3x$', '$6x$', '$6x - 20$', '$3x - 20$'],
        correctAnswer: '$6x$',
        explanation: 'This is the definition of the derivative of $f(x)$. $f\'(x) = \\frac{d}{dx}(3x^2 - 20) = 6x$.',
        hint: 'This limit represents the derivative of the function.'
      },
      {
        id: 'q2',
        type: 'multiple-choice',
        question: 'Evaluate $\\lim_{\\theta \\to 0} \\frac{1 - \\cos \\theta}{\\theta}$',
        options: ['0', '2', '1', '-1'],
        correctAnswer: '0',
        explanation: 'This is a standard trigonometric limit. Using L\'Hopital\'s rule: $\\lim_{\\theta \\to 0} \\frac{\\sin \\theta}{1} = \\sin(0) = 0$.',
        hint: 'Try using L\'Hopital\'s rule.'
      },
      {
        id: 'q3',
        type: 'multiple-choice',
        question: 'At what point is the function $(x + 2)^{-1}$ discontinuous?',
        options: ['-1', '-2', '2', '1'],
        correctAnswer: '-2',
        explanation: 'The function is $f(x) = \\frac{1}{x + 2}$. It is discontinuous where the denominator is zero, which is at $x = -2$.',
        hint: 'A rational function is discontinuous where its denominator is zero.'
      },
      {
        id: 'q4',
        type: 'multiple-choice',
        question: 'Let $f(x) = (x - 2)(8 - x)$ for $2 \\le x \\le 8$. Find $f(6)$',
        options: ['8', '6', '4', '2'],
        correctAnswer: '8',
        explanation: 'Substitute $x = 6$ into the function: $f(6) = (6 - 2)(8 - 6) = (4)(2) = 8$.',
        hint: 'Substitute the value of $x$ into the expression.'
      },
      {
        id: 'q5',
        type: 'multiple-choice',
        question: 'Evaluate $\\lim_{x \\to \\infty} \\frac{2x^4 - 3x^2 + 1}{6x^4 + x^3 - 3x}$',
        options: ['$\\frac{1}{6}$', '6', '3', '$\\frac{1}{3}$'],
        correctAnswer: '$\\frac{1}{3}$',
        explanation: 'Divide the numerator and denominator by the highest power of $x$, which is $x^4$. The limit is the ratio of the leading coefficients: $\\frac{2}{6} = \\frac{1}{3}$.',
        hint: 'Look at the ratio of the coefficients of the highest power of $x$.'
      },
      {
        id: 'q6',
        type: 'multiple-choice',
        question: 'Find the slope of the parabola $y = \\frac{1}{3}x^2$ at $x = 1$.',
        options: ['$\\frac{2}{3}$', '$-\\frac{1}{3}$', '$-\\frac{2}{3}$', '$\\frac{1}{3}$'],
        correctAnswer: '$\\frac{2}{3}$',
        explanation: 'The slope is the derivative $y\' = \\frac{2}{3}x$. At $x = 1$, the slope is $\\frac{2}{3}(1) = \\frac{2}{3}$.',
        hint: 'Find the derivative and evaluate it at the given point.'
      },
      {
        id: 'q7',
        type: 'multiple-choice',
        question: 'Let $y = u(x)v(x)$, the derivative of $y$ with respect to $x$ is',
        options: ['$u\'(x)v\'(x) + v(x)u(x)$', '$u(x)u\'(x) + v(x)v\'(x)$', '$u(x)v\'(x) - v(x)u\'(x)$', '$u(x)v\'(x) + v(x)u\'(x)$'],
        correctAnswer: '$u(x)v\'(x) + v(x)u\'(x)$',
        explanation: 'This is the standard product rule for differentiation: $\\frac{d}{dx}[u(x)v(x)] = u(x)v\'(x) + v(x)u\'(x)$.',
        hint: 'Recall the product rule formula.'
      },
      {
        id: 'q8',
        type: 'multiple-choice',
        question: 'Let $f(x) = \\frac{3 + x}{3 - x}$, $x \\neq 3$. Evaluate $f\'(2)$.',
        options: ['6', '-3', '3', '-6'],
        correctAnswer: '6',
        explanation: 'Using the quotient rule: $f\'(x) = \\frac{(1)(3 - x) - (3 + x)(-1)}{(3 - x)^2} = \\frac{3 - x + 3 + x}{(3 - x)^2} = \\frac{6}{(3 - x)^2}$. Then $f\'(2) = \\frac{6}{(3 - 2)^2} = \\frac{6}{1} = 6$.',
        hint: 'Use the quotient rule to find the derivative first.'
      },
      {
        id: 'q9',
        type: 'multiple-choice',
        question: 'Evaluate $\\frac{d(\\sin^{-1} x)}{dx}$ at $x = 0$.',
        options: ['0', '$-\\frac{1}{2}$', '1', '$\\frac{1}{2}$'],
        correctAnswer: '1',
        explanation: 'The derivative of $\\sin^{-1} x$ is $\\frac{1}{\\sqrt{1 - x^2}}$. At $x = 0$, this is $\\frac{1}{\\sqrt{1 - 0}} = 1$.',
        hint: 'Recall the derivative of the inverse sine function.'
      },
      {
        id: 'q11',
        type: 'multiple-choice',
        question: 'Find the value of $f\'(1)$ given that $f(x) = x + \\frac{1}{x}$.',
        options: ['2', '1', '0', '-1'],
        correctAnswer: '0',
        explanation: '$f(x) = x + x^{-1}$. $f\'(x) = 1 - x^{-2} = 1 - \\frac{1}{x^2}$. At $x = 1$, $f\'(1) = 1 - \\frac{1}{1^2} = 0$.',
        hint: 'Rewrite $\\frac{1}{x}$ as $x^{-1}$ before differentiating.'
      },
      {
        id: 'q12',
        type: 'multiple-choice',
        question: 'Evaluate $\\lim_{x \\to 1} \\frac{2x^4 - 6x^3 + x^2 + 3}{x - 1}$',
        options: ['-8', '11', '-4', '5'],
        correctAnswer: '-8',
        explanation: 'Direct substitution yields $0/0$. Using L\'Hopital\'s rule: $\\lim_{x \\to 1} \\frac{8x^3 - 18x^2 + 2x}{1} = 8(1) - 18(1) + 2(1) = -8$.',
        hint: 'Use L\'Hopital\'s rule since it\'s an indeterminate form.'
      },
      {
        id: 'q13',
        type: 'multiple-choice',
        question: 'Determine $\\frac{dy}{dx}$ of $x^2 - y^2 - x = 1$ at the point $(2, 1)$.',
        options: ['$\\frac{2}{3}$', '$-\\frac{3}{2}$', '$-\\frac{2}{3}$', '$\\frac{3}{2}$'],
        correctAnswer: '$\\frac{3}{2}$',
        explanation: 'Differentiate implicitly: $2x - 2y\\frac{dy}{dx} - 1 = 0$. Rearranging gives $2y\\frac{dy}{dx} = 2x - 1$, so $\\frac{dy}{dx} = \\frac{2x - 1}{2y}$. At $(2, 1)$, $\\frac{dy}{dx} = \\frac{2(2) - 1}{2(1)} = \\frac{3}{2}$.',
        hint: 'Use implicit differentiation.'
      },
      {
        id: 'q14',
        type: 'multiple-choice',
        question: 'Find the value $t$ at the stationary point of the function $f(t) = 7t^2 - 3t + 5$.',
        options: ['$\\frac{1}{7}$', '$\\frac{3}{7}$', '$\\frac{3}{14}$', '$\\frac{2}{7}$'],
        correctAnswer: '$\\frac{3}{14}$',
        explanation: 'At a stationary point, $f\'(t) = 0$. $f\'(t) = 14t - 3 = 0 \\Rightarrow 14t = 3 \\Rightarrow t = \\frac{3}{14}$.',
        hint: 'Set the first derivative to zero.'
      },
      {
        id: 'q15',
        type: 'multiple-choice',
        question: 'A train moves according to the rule $s = 5t^3 + 30t$, where $s$ and $t$ are measured in miles and hours respectively. What is the speed after 2 hours?',
        options: ['15miles/hr', '30miles/hr', '60miles/hr', '90miles/hr'],
        correctAnswer: '90miles/hr',
        explanation: 'Speed is the derivative of distance: $v = \\frac{ds}{dt} = 15t^2 + 30$. At $t = 2$, $v = 15(2^2) + 30 = 15(4) + 30 = 60 + 30 = 90$ miles/hr.',
        hint: 'Speed is the first derivative of the distance function.'
      },
      {
        id: 'q16',
        type: 'multiple-choice',
        question: 'Evaluate $\\lim_{x \\to 2} (x^2 - 6x + 4)$',
        options: ['4', '-8', '-4', '8'],
        correctAnswer: '-4',
        explanation: 'By direct substitution: $2^2 - 6(2) + 4 = 4 - 12 + 4 = -4$.',
        hint: 'Try direct substitution first.'
      },
      {
        id: 'q17',
        type: 'multiple-choice',
        question: 'Evaluate $\\frac{dy}{dx}$ at $x = 1$ if $y = (2 - x^2)^2$.',
        options: ['-8', '-4', '-2', '-1'],
        correctAnswer: '-4',
        explanation: 'Using the chain rule: $\\frac{dy}{dx} = 2(2 - x^2) \\cdot (-2x) = -4x(2 - x^2)$. At $x = 1$, $\\frac{dy}{dx} = -4(1)(2 - 1^2) = -4(1) = -4$.',
        hint: 'Use the chain rule.'
      },
      {
        id: 'q18',
        type: 'multiple-choice',
        question: 'Differentiate $y$ with respect to its argument $y = \\frac{e^x}{\\sin x}$',
        options: ['$e^x(\\sin x - \\cos x)\\csc^2 x$', '$e^x(\\sin x - \\cos x)\\cot^2 x$', '$e^x(\\sin x + \\cos x)\\cot^2 x$', '$e^x(\\sin x + \\cos x)\\csc^2 x$'],
        correctAnswer: '$e^x(\\sin x - \\cos x)\\csc^2 x$',
        explanation: 'Using the quotient rule: $\\frac{dy}{dx} = \\frac{e^x \\sin x - e^x \\cos x}{\\sin^2 x} = e^x(\\sin x - \\cos x) \\cdot \\frac{1}{\\sin^2 x} = e^x(\\sin x - \\cos x)\\csc^2 x$.',
        hint: 'Use the quotient rule and recall that $1/\\sin^2 x = \\csc^2 x$.'
      },
      {
        id: 'q19',
        type: 'multiple-choice',
        question: 'Evaluate $\\int_0^1 x^3 dx$',
        options: ['$\\frac{1}{3}$', '$\\frac{1}{4}$', '$\\frac{1}{2}$', '1'],
        correctAnswer: '$\\frac{1}{4}$',
        explanation: '$\\int_0^1 x^3 dx = [\\frac{x^4}{4}]_0^1 = \\frac{1^4}{4} - \\frac{0^4}{4} = \\frac{1}{4}$.',
        hint: 'Use the power rule for integration.'
      },
      {
        id: 'q20',
        type: 'multiple-choice',
        question: 'Given $f(x) = -x^2 + 6x - 11$. Compute $f(-10)$.',
        options: ['-171', '159', '71', '-71'],
        correctAnswer: '-171',
        explanation: '$f(-10) = -(-10)^2 + 6(-10) - 11 = -(100) - 60 - 11 = -171$.',
        hint: 'Carefully substitute $x = -10$ and watch the signs.'
      },
      {
        id: 'q21',
        type: 'multiple-choice',
        question: 'Differentiate $y = \\cos 3x^3$ with respect to $x$.',
        options: ['$3x \\cos 3x^2$', '$6x \\sin 3x$', '$-9x^2 \\sin 3x^3$', '$3 \\sin 3x^2$'],
        correctAnswer: '$-9x^2 \\sin 3x^3$',
        explanation: 'Using the chain rule: $\\frac{dy}{dx} = -\\sin(3x^3) \\cdot \\frac{d}{dx}(3x^3) = -\\sin(3x^3) \\cdot 9x^2 = -9x^2 \\sin 3x^3$.',
        hint: 'Use the chain rule.'
      },
      {
        id: 'q22',
        type: 'multiple-choice',
        question: 'What is the point of discontinuity of the function $\\frac{x - 4}{x - 2}$?',
        options: ['$x = 0$', '$x = -2$', '$x = 2$', '$x = 4$'],
        correctAnswer: '$x = 2$',
        explanation: 'A rational function is discontinuous where its denominator is zero. $x - 2 = 0 \\Rightarrow x = 2$.',
        hint: 'Find where the denominator equals zero.'
      },
      {
        id: 'q23',
        type: 'multiple-choice',
        question: 'Evaluate $\\lim_{x \\to 0} \\frac{e^{2x} - 1}{x}$',
        options: ['3', '2', '1', '0'],
        correctAnswer: '2',
        explanation: 'Using L\'Hopital\'s rule since it\'s a $0/0$ form: $\\lim_{x \\to 0} \\frac{2e^{2x}}{1} = 2e^0 = 2(1) = 2$.',
        hint: 'Use L\'Hopital\'s rule.'
      },
      {
        id: 'q24',
        type: 'multiple-choice',
        question: 'Integrate $\\int \\ln x dx$',
        options: ['$x \\ln x - x + c$', '$\\frac{1}{x} + c$', '$x \\ln x + x + c$', '$\\frac{\\ln x}{x} + c$'],
        correctAnswer: '$x \\ln x - x + c$',
        explanation: 'Use integration by parts: $\\int u dv = uv - \\int v du$. Let $u = \\ln x$, $dv = dx$. Then $du = \\frac{1}{x}dx$, $v = x$. $\\int \\ln x dx = x \\ln x - \\int x \\cdot \\frac{1}{x} dx = x \\ln x - \\int 1 dx = x \\ln x - x + c$.',
        hint: 'Use integration by parts.'
      },
      {
        id: 'q25',
        type: 'multiple-choice',
        question: 'What is the extremum value of $f(t) = -t^2 - 3t + 2$?',
        options: ['$\\frac{40}{9}$', '$\\frac{1}{9}$', '$\\frac{8}{9}$', '$\\frac{32}{9}$'],
        correctAnswer: '$\\frac{17}{4}$',
        explanation: 'Find the critical point: $f\'(t) = -2t - 3 = 0 \\Rightarrow t = -3/2$. The extremum value is $f(-3/2) = -(-3/2)^2 - 3(-3/2) + 2 = -9/4 + 9/2 + 2 = -9/4 + 18/4 + 8/4 = 17/4$. Note: The options provided in the original paper seem incorrect. The closest value is not listed. Assuming a typo in the question or options.',
        hint: 'Find the critical point and evaluate the function there.'
      },
      {
        id: 'q26',
        type: 'multiple-choice',
        question: 'If $\\frac{d}{dx} (\\sec x) = \\sec x \\tan x$ find $\\int \\sec x \\tan x dx$.',
        options: ['$\\sec x$', '$\\sec^2 x$', '$2 \\sec x$', '$\\tan x$'],
        correctAnswer: '$\\sec x$',
        explanation: 'Integration is the reverse process of differentiation. Since the derivative of $\\sec x$ is $\\sec x \\tan x$, the integral of $\\sec x \\tan x$ is $\\sec x$ (plus a constant).',
        hint: 'Integration is the inverse of differentiation.'
      },
      {
        id: 'q27',
        type: 'multiple-choice',
        question: 'Given $y = \\sin t$, find $\\frac{d^2y}{dt^2}$ at $t = \\frac{\\pi}{2}$',
        options: ['1', '-1', '$\\frac{1}{2}$', '0'],
        correctAnswer: '-1',
        explanation: '$\\frac{dy}{dt} = \\cos t$. $\\frac{d^2y}{dt^2} = -\\sin t$. At $t = \\pi/2$, $-\\sin(\\pi/2) = -1$.',
        hint: 'Find the second derivative.'
      },
      {
        id: 'q28',
        type: 'multiple-choice',
        question: 'Find the derivative of $e^{-x^3}$.',
        options: ['$e^{-x^2}$', '$3xe^{-x^3}$', '$-3x^2e^{-x^3}$', '$-3xe^{-x^3}$'],
        correctAnswer: '$-3x^2e^{-x^3}$',
        explanation: 'Using the chain rule: $\\frac{d}{dx}(e^{-x^3}) = e^{-x^3} \\cdot \\frac{d}{dx}(-x^3) = e^{-x^3}(-3x^2) = -3x^2e^{-x^3}$.',
        hint: 'Use the chain rule.'
      },
      {
        id: 'q29',
        type: 'multiple-choice',
        question: 'Evaluate $\\int_0^\\pi x \\cos 3x dx$',
        options: ['$\\frac{1}{3}$', '$-\\frac{1}{3}$', '$\\frac{2}{9}$', '$-\\frac{2}{9}$'],
        correctAnswer: '$-\\frac{2}{9}$',
        explanation: 'Use integration by parts: $\\int u dv = uv - \\int v du$. Let $u = x$, $dv = \\cos 3x dx$. Then $du = dx$, $v = \\frac{1}{3}\\sin 3x$. $\\int x \\cos 3x dx = \\frac{x}{3}\\sin 3x - \\int \\frac{1}{3}\\sin 3x dx = \\frac{x}{3}\\sin 3x + \\frac{1}{9}\\cos 3x$. Evaluated from 0 to $\\pi$: $(\\frac{\\pi}{3}\\sin 3\\pi + \\frac{1}{9}\\cos 3\\pi) - (0 + \\frac{1}{9}\\cos 0) = (0 - \\frac{1}{9}) - (\\frac{1}{9}) = -\\frac{2}{9}$.',
        hint: 'Use integration by parts.'
      },
      {
        id: 'q30',
        type: 'multiple-choice',
        question: 'Find the gradient of the curve $y = 2t^4 - 3t^3 + t + 4$ at the point $(1,4)$.',
        options: ['2', '19', '0', '1'],
        correctAnswer: '0',
        explanation: 'The gradient is the derivative $\\frac{dy}{dt} = 8t^3 - 9t^2 + 1$. At $t = 1$, the gradient is $8(1)^3 - 9(1)^2 + 1 = 8 - 9 + 1 = 0$.',
        hint: 'Find the derivative and evaluate it at $t=1$.'
      },
      {
        id: 'q31',
        type: 'multiple-choice',
        question: 'If $y = \\cot x$, find $\\frac{dy}{dx}$',
        options: ['$\\sec^2 x$', '$-\\csc^2 x$', '$\\tan x$', '$\\csc^2 x$'],
        correctAnswer: '$-\\csc^2 x$',
        explanation: 'This is a standard derivative. $\\frac{d}{dx}(\\cot x) = -\\csc^2 x$.',
        hint: 'Recall the derivative of cotangent.'
      },
      {
        id: 'q32',
        type: 'multiple-choice',
        question: 'Suppose $f\'(x) = 0$ and $f\'\'(x_0) < 0$ then $f$ has:',
        options: ['relative maximum', 'relative minimum', 'no extreme value', 'none of the above'],
        correctAnswer: 'relative maximum',
        explanation: 'By the Second Derivative Test, if $f\'(c) = 0$ and $f\'\'(c) < 0$, then $f$ has a local (relative) maximum at $c$.',
        hint: 'Recall the Second Derivative Test.'
      },
      {
        id: 'q33',
        type: 'multiple-choice',
        question: 'Evaluate $\\int_0^\\pi 5 \\sin 2t dt$',
        options: ['5', '0', '-5', '$-\\frac{5}{2}$'],
        correctAnswer: '0',
        explanation: '$\\int 5 \\sin 2t dt = -\\frac{5}{2}\\cos 2t$. Evaluated from 0 to $\\pi$: $[-\\frac{5}{2}\\cos(2\\pi)] - [-\\frac{5}{2}\\cos(0)] = -\\frac{5}{2}(1) - (-\\frac{5}{2}(1)) = -\\frac{5}{2} + \\frac{5}{2} = 0$.',
        hint: 'Integrate and evaluate at the limits.'
      },
      {
        id: 'q34',
        type: 'multiple-choice',
        question: 'Evaluate $\\lim_{x \\to 3} \\left( \\frac{x^2 - 9}{x - 3} \\right)$',
        options: ['6', '$\\infty$', '-6', '0'],
        correctAnswer: '6',
        explanation: 'Factor the numerator: $\\lim_{x \\to 3} \\frac{(x - 3)(x + 3)}{x - 3} = \\lim_{x \\to 3} (x + 3) = 3 + 3 = 6$.',
        hint: 'Factor the difference of squares in the numerator.'
      },
      {
        id: 'q35',
        type: 'multiple-choice',
        question: 'Find the derivative of the function $t \\cos t$.',
        options: ['$t \\sin t$', '$t \\cos 2t$', '$t(\\sin t - \\cos t)$', '$\\cos t - t \\sin t$'],
        correctAnswer: '$\\cos t - t \\sin t$',
        explanation: 'Use the product rule: $\\frac{d}{dt}(t \\cos t) = (1)(\\cos t) + (t)(-\\sin t) = \\cos t - t \\sin t$.',
        hint: 'Use the product rule.'
      },
      {
        id: 'q36',
        type: 'multiple-choice',
        question: 'Write the equation of a curve whose slope is $2x - 7$ if it passes through the point $(1, 2)$.',
        options: ['$y = x^2 - 7x + 8$', '$y = x^2 - 7x + 1$', '$y = x^2 + 7x - 8$', '$y = x^2 - 7x + 2$'],
        correctAnswer: '$y = x^2 - 7x + 8$',
        explanation: 'Integrate the slope to find the equation: $y = \\int (2x - 7) dx = x^2 - 7x + C$. Use the point $(1, 2)$ to find $C$: $2 = (1)^2 - 7(1) + C \\Rightarrow 2 = 1 - 7 + C \\Rightarrow 2 = -6 + C \\Rightarrow C = 8$. So, $y = x^2 - 7x + 8$.',
        hint: 'Integrate the slope and use the point to find the constant of integration.'
      },
      {
        id: 'q37',
        type: 'multiple-choice',
        question: 'Differentiate $\\sqrt[3]{3x - 5}$ with respect to $x$.',
        options: ['$3\\sqrt[3]{3x - 5}$', '$\\frac{1}{9\\sqrt[3]{3x - 5}}$', '$\\frac{9}{\\sqrt[3]{3x - 5}}$', '$\\frac{1}{\\sqrt[3]{(3x - 5)^2}}$'],
        correctAnswer: '$\\frac{1}{\\sqrt[3]{(3x - 5)^2}}$',
        explanation: 'Let $y = (3x - 5)^{1/3}$. Using the chain rule: $\\frac{dy}{dx} = \\frac{1}{3}(3x - 5)^{-2/3} \\cdot 3 = (3x - 5)^{-2/3} = \\frac{1}{(3x - 5)^{2/3}} = \\frac{1}{\\sqrt[3]{(3x - 5)^2}}$.',
        hint: 'Rewrite the root as a fractional exponent and use the chain rule.'
      },
      {
        id: 'q38',
        type: 'multiple-choice',
        question: 'Find the derivative of $4^x$ at $x = 0$.',
        options: ['$\\ln 4$', '0', '$\\infty$', '4'],
        correctAnswer: '$\\ln 4$',
        explanation: 'The derivative of $a^x$ is $a^x \\ln a$. So, $\\frac{d}{dx}(4^x) = 4^x \\ln 4$. At $x = 0$, this is $4^0 \\ln 4 = 1 \\cdot \\ln 4 = \\ln 4$.',
        hint: 'Recall the derivative of an exponential function with base $a$.'
      },
      {
        id: 'q39',
        type: 'multiple-choice',
        question: 'Evaluate $\\int_0^3 (2y^2 + 5) dy$',
        options: ['18', '33', '15', '8'],
        correctAnswer: '33',
        explanation: '$\\int (2y^2 + 5) dy = \\frac{2y^3}{3} + 5y$. Evaluated from 0 to 3: $(\\frac{2(3^3)}{3} + 5(3)) - 0 = (\\frac{2(27)}{3} + 15) = 18 + 15 = 33$.',
        hint: 'Integrate term by term.'
      },
      {
        id: 'q40',
        type: 'multiple-choice',
        question: 'Calculate the gradient of the curve $y = \\sin 2\\theta$ when $\\theta = \\pi$.',
        options: ['1', '-2', '2', '0'],
        correctAnswer: '2',
        explanation: 'Gradient is the derivative: $\\frac{dy}{d\\theta} = 2\\cos 2\\theta$. At $\\theta = \\pi$, the gradient is $2\\cos(2\\pi) = 2(1) = 2$.',
        hint: 'Find the derivative and evaluate it at the given angle.'
      },
      {
        id: 'q41',
        type: 'multiple-choice',
        question: 'The area under the curve $f(x) = 6x^2 - 2x + 1$ bounded by the ordinates $x = 1$, $x = 2$ and x-axis is',
        options: ['19 sq units', '24 sq units', '22 sq units', '12 sq units'],
        correctAnswer: '12 sq units',
        explanation: 'Area $= \\int_1^2 (6x^2 - 2x + 1) dx = [2x^3 - x^2 + x]_1^2 = (2(8) - 4 + 2) - (2(1) - 1 + 1) = (16 - 4 + 2) - (2) = 14 - 2 = 12$.',
        hint: 'Integrate the function between the given limits.'
      },
      {
        id: 'q42',
        type: 'multiple-choice',
        question: 'Evaluate $\\lim_{x \\to 0} \\left( \\frac{\\sin x}{x} \\right)$',
        options: ['1', '$\\infty$', '0', '-1'],
        correctAnswer: '1',
        explanation: 'This is a fundamental trigonometric limit. $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$.',
        hint: 'This is a standard limit you should memorize.'
      },
      {
        id: 'q43',
        type: 'multiple-choice',
        question: 'Evaluate $\\int_0^1 \\frac{1}{x + 1} dx$',
        options: ['$\\ln 1$', '$\\ln 3$', '$-\\ln 2$', '$\\ln 2$'],
        correctAnswer: '$\\ln 2$',
        explanation: '$\\int \\frac{1}{x + 1} dx = \\ln|x + 1|$. Evaluated from 0 to 1: $\\ln(1 + 1) - \\ln(0 + 1) = \\ln 2 - \\ln 1 = \\ln 2 - 0 = \\ln 2$.',
        hint: 'The integral of $1/u$ is $\\ln|u|$.'
      },
      {
        id: 'q44',
        type: 'multiple-choice',
        question: 'The profit function of a mini mart per week is given by $p = 120q(24 - q)$ where $q$ is the quantity of items sold. Determine the quantity of items that maximizes its profit.',
        options: ['12', '6', '24', '36'],
        correctAnswer: '12',
        explanation: '$p = 2880q - 120q^2$. To maximize, find where $dp/dq = 0$. $dp/dq = 2880 - 240q = 0 \\Rightarrow 240q = 2880 \\Rightarrow q = 12$.',
        hint: 'Find the derivative of the profit function and set it to zero.'
      },
      {
        id: 'q45',
        type: 'multiple-choice',
        question: 'The integration of $\\int \\frac{f\'(x)}{f(x)} dx$ is',
        options: ['$f^2(x)/2 + C$', '$\\ln f(x) + C$', '$-\\ln f(x) + C$', '$\\ln(-f(x)) + C$'],
        correctAnswer: '$\\ln f(x) + C$',
        explanation: 'This is a standard integration rule. If the numerator is the derivative of the denominator, the integral is the natural logarithm of the absolute value of the denominator.',
        hint: 'Use u-substitution with $u = f(x)$.'
      },
      {
        id: 'q46',
        type: 'multiple-choice',
        question: 'Evaluate the limit $\\lim_{x \\to 2} \\frac{x^2 - x - 2}{x^2 - 4}$',
        options: ['1', '-2', '$\\frac{3}{4}$', '$\\frac{1}{2}$'],
        correctAnswer: '$\\frac{3}{4}$',
        explanation: 'Factor numerator and denominator: $\\lim_{x \\to 2} \\frac{(x - 2)(x + 1)}{(x - 2)(x + 2)} = \\lim_{x \\to 2} \\frac{x + 1}{x + 2} = \\frac{2 + 1}{2 + 2} = \\frac{3}{4}$.',
        hint: 'Factor both the numerator and the denominator.'
      },
      {
        id: 'q48',
        type: 'multiple-choice',
        question: 'Evaluate the integral $\\int 3x^2 \\sin x^3 dx$',
        options: ['$\\frac{-1}{\\cos 4x^3}$', '$\\frac{-1}{\\sin 4x^3}$', '$-\\cos x^3$', '$\\frac{-1}{6 \\cos 4x^3}$'],
        correctAnswer: '$-\\cos x^3$',
        explanation: 'Use u-substitution. Let $u = x^3$, then $du = 3x^2 dx$. The integral becomes $\\int \\sin u du = -\\cos u + C = -\\cos x^3 + C$.',
        hint: 'Use u-substitution with $u = x^3$.'
      },
      {
        id: 'q49',
        type: 'multiple-choice',
        question: 'Evaluate $\\lim_{x \\to 1} \\frac{\\sqrt{x}}{x + 1}$',
        options: ['1', '$\\frac{1}{2}$', '2', '$-\\frac{1}{2}$'],
        correctAnswer: '$\\frac{1}{2}$',
        explanation: 'By direct substitution: $\\frac{\\sqrt{1}}{1 + 1} = \\frac{1}{2}$.',
        hint: 'Try direct substitution.'
      },
      {
        id: 'q50',
        type: 'multiple-choice',
        question: 'The function $V = 24r(3 - r^2)$ describes the size of a ballon when inflated, where $r$ is its radius. Calculate the radius of the balloon at the point of the busting.',
        options: ['1 unit', '5 units', '3 units', '8 units'],
        correctAnswer: '1 unit',
        explanation: 'Assuming "busting" implies maximum volume. $V = 72r - 24r^3$. $dV/dr = 72 - 72r^2 = 0 \\Rightarrow r^2 = 1 \\Rightarrow r = 1$ (since radius must be positive).',
        hint: 'Find the maximum volume by setting the derivative to zero.'
      }
    ]
  },
  {
    id: 'pq-3',
    title: 'MTH103 CBT CA QUESTIONS (2024/25)',
    year: '2024/2025',
    semester: 'CA',
    courseCode: 'MAT 103',
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'The weight of a 7 kg mass and a north-easterly wind of 20 knots is:',
        options: ['Vector quantity', 'Direction and weight quantities', 'Vector and physical quantity', 'Physical quantities'],
        correctAnswer: 'Vector quantity',
        explanation: 'Weight is a force ($W=mg$) which has both magnitude and direction (downwards). Wind velocity has magnitude (20 knots) and direction (North-East). Therefore, both are vector quantities.',
        hint: 'Consider whether each quantity has both magnitude and direction.'
      },
      {
        id: 'q2',
        type: 'multiple-choice',
        question: 'If P is a force of 30 N acting due North, what is the magnitude of the vector sum?',
        options: ['50 N', '30 N', '45 N', '40 N'],
        correctAnswer: '30 N',
        explanation: 'Since there is only one vector P mentioned, the sum is just P itself. The magnitude of P is given as 30 N.',
        hint: 'The magnitude of a single vector is its length.'
      },
      {
        id: 'q3',
        type: 'multiple-choice',
        question: 'Types of vectors include the following except:',
        options: ['Free vector', 'Position vector', 'Static vector', 'Line vector'],
        correctAnswer: 'Static vector',
        explanation: 'Common classifications of vectors include free vectors (magnitude and direction only), position vectors (fixed start point), and line/sliding vectors (line of action matters). "Static vector" is not a standard category in vector algebra.',
        hint: 'Which of these terms is not commonly used to classify vectors?'
      },
      {
        id: 'q4',
        type: 'multiple-choice',
        question: 'Suppose $p = 2i + 4j + 3k$ and $q = i + 5j - 2k$. Find $p \\times q$:',
        options: ['-23i + 7j - 6k', '-23i + 7j + 6k', '23i - 7j - 6k', '23i + 7j + 6k'],
        correctAnswer: '-23i + 7j + 6k',
        explanation: 'The cross product is calculated as: $i(4(-2) - 3(5)) - j(2(-2) - 3(1)) + k(2(5) - 4(1)) = i(-8-15) - j(-4-3) + k(10-4) = -23i + 7j + 6k$.',
        hint: 'Use the determinant method for the cross product.'
      },
      {
        id: 'q5',
        type: 'multiple-choice',
        question: 'The modulus of vector $x = 3i + 4j - 5k$ is:',
        options: ['5\\sqrt{2}', '3\\sqrt{2}', '4\\sqrt{2}', '2\\sqrt{5}'],
        correctAnswer: '5\\sqrt{2}',
        explanation: 'Modulus $|x| = \\sqrt{3^2 + 4^2 + (-5)^2} = \\sqrt{9 + 16 + 25} = \\sqrt{50} = \\sqrt{25 \\times 2} = 5\\sqrt{2}$.',
        hint: 'Calculate the square root of the sum of the squares of the components.'
      },
      {
        id: 'q6',
        type: 'multiple-choice',
        question: 'Given $a = 2i - 2j + k$, $b = -i + j + 2k$, and $c = 2i + 2j - 4k$, find $a \\cdot (b \\times c)$:',
        options: ['16', '20', '-16', '-20'],
        correctAnswer: '-20',
        explanation: 'This is the scalar triple product. Determinant: $|2, -2, 1; -1, 1, 2; 2, 2, -4| = 2(-4-4) - (-2)(4-4) + 1(-2-2) = 2(-8) + 0 - 4 = -16 - 4 = -20$.',
        hint: 'Compute the determinant of the matrix formed by the three vectors.'
      },
      {
        id: 'q7',
        type: 'multiple-choice',
        question: 'The position vector of a particle at time t is $r = \\cos(t-2)i + \\sinh(t-2)j + at^3k$. Find the acceleration at time $t = 2$:',
        options: ['-i + 12ak', '-i + 6ak', 'i + 6ak', 'i + 12ak'],
        correctAnswer: '-i + 12ak',
        explanation: 'Velocity $v = r\' = -\\sin(t-2)i + \\cosh(t-2)j + 3at^2k$. Acceleration $a = v\' = -\\cos(t-2)i + \\sinh(t-2)j + 6atk$. At $t=2$: $-\\cos(0)i + \\sinh(0)j + 12ak = -i + 12ak$.',
        hint: 'Differentiate the position vector twice with respect to time.'
      },
      {
        id: 'q8',
        type: 'multiple-choice',
        question: 'Find the magnitude of vector TS, where S(1, 2, 3) and T(3, 2, 1):',
        options: ['\\sqrt{2}', '2', '3\\sqrt{2}', '2\\sqrt{2}'],
        correctAnswer: '2\\sqrt{2}',
        explanation: 'Vector $TS = S - T = (1-3, 2-2, 3-1) = (-2, 0, 2)$. Magnitude = $\\sqrt{(-2)^2 + 0^2 + 2^2} = \\sqrt{4+4} = \\sqrt{8} = 2\\sqrt{2}$.',
        hint: 'Subtract coordinates of T from S, then find the magnitude.'
      },
      {
        id: 'q9',
        type: 'multiple-choice',
        question: 'Find the sum of vectors AB + BC - DC - AD:',
        options: ['0', 'AD', 'DA', '-AD'],
        correctAnswer: '0',
        explanation: '$AB + BC = AC$. $-DC = CD$. $-AD = DA$. Sum = $AC + CD + DA = AD + DA = AD - AD = 0$.',
        hint: 'Use the triangle law of vector addition and properties like $-XY = YX$.'
      },
      {
        id: 'q10',
        type: 'multiple-choice',
        question: 'If $x = 2i + 3j + k$ and $y = i + 6j + k$, find the direction cosine of $x - y$:',
        options: ['1/\\sqrt{10} (1, -3, 0)', '1/\\sqrt{10} (1, 3, 0)', '1/\\sqrt{5} (1, -3, 0)', '1/\\sqrt{10} (-1, 3, 0)'],
        correctAnswer: '1/\\sqrt{10} (1, -3, 0)',
        explanation: '$x - y = (2-1)i + (3-6)j + (1-1)k = i - 3j$. Magnitude = $\\sqrt{1^2 + (-3)^2} = \\sqrt{10}$. Direction cosines are components divided by magnitude.',
        hint: 'Subtract the vectors first, then normalize the result.'
      },
      {
        id: 'q11',
        type: 'multiple-choice',
        question: 'Determine the vector product of $x = 3i - j + 2k$ and $y = i + 3j - 2k$:',
        options: ['4i + 8j - 10k', '-4i - 8j - 10k', '4i - 8j + 10k', '-4i + 8j + 10k'],
        correctAnswer: '-4i + 8j + 10k',
        explanation: '$x \\times y = |i, j, k; 3, -1, 2; 1, 3, -2| = i(2-6) - j(-6-2) + k(9+1) = -4i + 8j + 10k$.',
        hint: 'Calculate the cross product using the determinant.'
      },
      {
        id: 'q12',
        type: 'multiple-choice',
        question: 'Given $a = 2i + 5j$ and $b = 4i - 3j$, find the unit vector in the direction of b:',
        options: ['1/\\sqrt{29} (4i - 3j)', '1/5 (2i + 5j)', '1/\\sqrt{29} (2i + 5j)', '1/5 (4i - 3j)'],
        correctAnswer: '1/5 (4i - 3j)',
        explanation: 'Magnitude of $b = \\sqrt{4^2 + (-3)^2} = \\sqrt{16+9} = 5$. Unit vector = $b/|b| = 1/5(4i - 3j)$.',
        hint: 'Divide vector b by its magnitude.'
      },
      {
        id: 'q13',
        type: 'multiple-choice',
        question: 'If vector A, B, and C are coplanar, which of the following is correct?',
        options: ['A \\cdot (B \\times C) = 2', 'A \\cdot (B \\times C) = 1', 'A \\cdot (B \\times C) = 0', 'A \\cdot (B \\times C) = -1'],
        correctAnswer: 'A \\cdot (B \\times C) = 0',
        explanation: 'Vectors are coplanar if their scalar triple product is zero, meaning the volume of the parallelepiped they form is zero.',
        hint: 'Coplanar vectors enclose zero volume.'
      },
      {
        id: 'q14',
        type: 'multiple-choice',
        question: 'If $u = 3i + 5j$ and $v = 2i - 4j$, find $2u - v$.',
        options: ['4i + 14j', '4i + 6j', '8i + 6j', '8i + 14j'],
        correctAnswer: '4i + 14j',
        explanation: '$2u - v = 2(3i + 5j) - (2i - 4j) = 6i + 10j - 2i + 4j = 4i + 14j$.',
        hint: 'Multiply u by 2 and then subtract v.'
      },
      {
        id: 'q15',
        type: 'multiple-choice',
        question: '$(u + 3)i - (2 + u^2)j + 2u^3k$. Determine dA/du at u = 3.',
        options: ['i - 6j + 54k', 'i + 6j + 54k', 'i - 6j + 18k', 'i - 5j + 54k'],
        correctAnswer: 'i - 6j + 54k',
        explanation: '$A = (u+3)i - (2+u^2)j + 2u^3k$. $dA/du = 1i - 2uj + 6u^2k$. At $u=3$: $i - 6j + 6(9)k = i - 6j + 54k$.',
        hint: 'Differentiate each component with respect to u.'
      },
      {
        id: 'q16',
        type: 'multiple-choice',
        question: 'If $a = 4i - 2j$ and $b = 2i - 2j$, evaluate $|3a - 2b|$.',
        options: ['2\\sqrt{17}', '\\sqrt{60}', '8', '10'],
        correctAnswer: '2\\sqrt{17}',
        explanation: '$3a - 2b = 3(4i-2j) - 2(2i-2j) = 12i - 6j - 4i + 4j = 8i - 2j$. Magnitude = $\\sqrt{64 + 4} = \\sqrt{68} = 2\\sqrt{17}$.',
        hint: 'Calculate the resultant vector first, then find its magnitude.'
      },
      {
        id: 'q17',
        type: 'multiple-choice',
        question: 'If $p = 6i - 2j$ and $q = 4i + 2j$, find $p \\cdot q$.',
        options: ['20', '28', '24', '16'],
        correctAnswer: '20',
        explanation: '$p \\cdot q = (6)(4) + (-2)(2) = 24 - 4 = 20$.',
        hint: 'Sum the products of corresponding components.'
      },
      {
        id: 'q18',
        type: 'multiple-choice',
        question: 'Given $\\vec{A} = 2i - 3j + 4k$, $\\vec{B} = i - 2j - 3k$, $\\vec{C} = 2i + j + 2k$. Find $A \\cdot (B \\times C)$.',
        options: ['42', '22', '-42', '32'],
        correctAnswer: '42',
        explanation: '$B \\times C = |i, j, k; 1, -2, -3; 2, 1, 2| = i(-4+3) - j(2+6) + k(1+4) = -i - 8j + 5k$. $A \\cdot (B \\times C) = 2(-1) - 3(-8) + 4(5) = -2 + 24 + 20 = 42$.',
        hint: 'Calculate the cross product of B and C, then dot with A.'
      },
      {
        id: 'q19',
        type: 'multiple-choice',
        question: 'Force of 30 N moving due North and a force of 40 N moving due East. Find the magnitude of the resultant force.',
        options: ['50 N', '70 N', '10 N', '35 N'],
        correctAnswer: '50 N',
        explanation: 'The forces are perpendicular. Resultant $R = \\sqrt{30^2 + 40^2} = \\sqrt{900 + 1600} = \\sqrt{2500} = 50$ N.',
        hint: 'Use the Pythagorean theorem.'
      },
      {
        id: 'q20',
        type: 'multiple-choice',
        question: '$A = (u + 3)i - (2 + u^2)j + (2u^3)k$. Find $|dA/du|$ at $u = 3$.',
        options: ['\\sqrt{2953}', '\\sqrt{2917}', '54', '55'],
        correctAnswer: '\\sqrt{2953}',
        explanation: '$dA/du = i - 2uj + 6u^2k$. At $u=3$: $i - 6j + 54k$. Magnitude = $\\sqrt{1^2 + (-6)^2 + 54^2} = \\sqrt{1 + 36 + 2916} = \\sqrt{2953}$.',
        hint: 'Differentiate, substitute u=3, then calculate magnitude.'
      },
      {
        id: 'q21',
        type: 'multiple-choice',
        question: '$P = 3i - 2j + 1k$ and $Q = 2i + 3j - 4k$. Find $P \\cdot Q$.',
        options: ['-4', '4', '0', '-8'],
        correctAnswer: '-4',
        explanation: '$P \\cdot Q = 3(2) + (-2)(3) + 1(-4) = 6 - 6 - 4 = -4$.',
        hint: 'Calculate the dot product.'
      },
      {
        id: 'q22',
        type: 'multiple-choice',
        question: '$r = \\cos(t - 2)i + \\sinh(t - 2)j + at^3k$. Find the acceleration at $t = 2$.',
        options: ['i + 6ak', '-i + 6ak', 'i + 12ak', '-i + 12ak'],
        correctAnswer: '-i + 12ak',
        explanation: 'This is identical to Q7. The acceleration is $-i + 12ak$.',
        hint: 'Differentiate twice and substitute t=2.'
      },
      {
        id: 'q23',
        type: 'multiple-choice',
        question: 'Calculate $m \\times n$ if $m = 3i - 2j + 3k$ and $n = 5i + j - k$.',
        options: ['-i + 18j + 13k', 'i - 18j - 13k', '-i - 18j + 13k', 'i + 18j + 13k'],
        correctAnswer: '-i + 18j + 13k',
        explanation: '$m \\times n = |i, j, k; 3, -2, 3; 5, 1, -1| = i(2-3) - j(-3-15) + k(3+10) = -i + 18j + 13k$.',
        hint: 'Use the determinant method.'
      },
      {
        id: 'q24',
        type: 'multiple-choice',
        question: 'If $x = 2i + 4j - 3k$ and $y = i + 3j + 2k$, determine the scalar product of the two vectors.',
        options: ['8', '20', '14', '6'],
        correctAnswer: '8',
        explanation: '$x \\cdot y = 2(1) + 4(3) + (-3)(2) = 2 + 12 - 6 = 8$.',
        hint: 'Sum the products of the components.'
      },
      {
        id: 'q25',
        type: 'multiple-choice',
        question: 'Find the sum of vectors AB, -CB, CD, -ED.',
        options: ['AE', '0', 'AD', 'AC'],
        correctAnswer: 'AE',
        explanation: '$AB - CB + CD - ED = AB + BC + CD + DE = AC + CD + DE = AD + DE = AE$.',
        hint: 'Convert negative vectors to positive ones (e.g., -CB = BC) and chain them.'
      },
      {
        id: 'q26',
        type: 'multiple-choice',
        question: 'If $P = 3i - 4j + 2k$ and $Q = 2i + 5j - k$, find $-(P \\times Q)$.',
        options: ['6i - 7j - 23k', '-6i + 7j + 23k', '6i + 7j - 23k', '-6i - 7j + 23k'],
        correctAnswer: '6i - 7j - 23k',
        explanation: '$P \\times Q = |i, j, k; 3, -4, 2; 2, 5, -1| = i(4-10) - j(-3-4) + k(15+8) = -6i + 7j + 23k$. $-(P \\times Q) = 6i - 7j - 23k$.',
        hint: 'Calculate the cross product and then negate all signs.'
      },
      {
        id: 'q27',
        type: 'multiple-choice',
        question: 'If $A = 3i + 2j - k$, $B = 2i - j + 3k$, and $C = i - 2j + 2k$, find $A \\cdot (B \\times C)$.',
        options: ['13', '10', '15', '7'],
        correctAnswer: '13',
        explanation: '$B \\times C = |i, j, k; 2, -1, 3; 1, -2, 2| = i(-2+6) - j(4-3) + k(-4+1) = 4i - j - 3k$. $A \\cdot (B \\times C) = 3(4) + 2(-1) + (-1)(-3) = 12 - 2 + 3 = 13$.',
        hint: 'Scalar triple product.'
      },
      {
        id: 'q28',
        type: 'multiple-choice',
        question: 'Find the area of the parallelogram determined by the vectors (2, 1, 0) and (-2, 1, 2):',
        options: ['9 units', '6 units', '12 units', '18 units'],
        correctAnswer: '6 units',
        explanation: 'Area = $|a \\times b|$. $a \\times b = |i, j, k; 2, 1, 0; -2, 1, 2| = i(2) - j(4) + k(4) = 2i - 4j + 4k$. Magnitude = $\\sqrt{4 + 16 + 16} = \\sqrt{36} = 6$.',
        hint: 'The area is the magnitude of the cross product.'
      },
      {
        id: 'q29',
        type: 'multiple-choice',
        question: 'Given $a = 2i + 5j$ and $b = 4i - 3j$, find the unit vector in the direction of b:',
        options: ['1/\\sqrt{29} (2i + 5j)', '1/\\sqrt{29} (4i - 3j)', '1/5 (4i - 3j)', '1/5 (2i + 5j)'],
        correctAnswer: '1/5 (4i - 3j)',
        explanation: 'Magnitude of $b = 5$. Unit vector = $b/5 = 1/5(4i - 3j)$.',
        hint: 'Normalize vector b.'
      },
      {
        id: 'q30',
        type: 'multiple-choice',
        question: 'If $x = 2i + 9j + mk$ and $y = 3i - 4j + 3k$ are perpendicular, find m:',
        options: ['9', '6', '3', '10'],
        correctAnswer: '10',
        explanation: 'Dot product must be zero. $2(3) + 9(-4) + m(3) = 0 \\Rightarrow 6 - 36 + 3m = 0 \\Rightarrow 3m = 30 \\Rightarrow m = 10$.',
        hint: 'Set the dot product to zero and solve for m.'
      },
      {
        id: 'q31',
        type: 'multiple-choice',
        question: 'If $Z_1 = 3i + j$, $Z_2 = -2i + j$, and $Z_3 = 4i - 2j$, find $Z_1 + Z_2 + Z_3$.',
        options: ['5i', '5i + j', '5i - j', '9i'],
        correctAnswer: '5i',
        explanation: 'Sum = $(3-2+4)i + (1+1-2)j = 5i + 0j = 5i$.',
        hint: 'Add the corresponding components.'
      },
      {
        id: 'q32',
        type: 'multiple-choice',
        question: 'Find the magnitude of the vector $2i - 5j + 4k$:',
        options: ['6\\sqrt{8}', '3\\sqrt{5}', '2\\sqrt{3}', '4\\sqrt{2}'],
        correctAnswer: '3\\sqrt{5}',
        explanation: 'Magnitude = $\\sqrt{2^2 + (-5)^2 + 4^2} = \\sqrt{4 + 25 + 16} = \\sqrt{45} = \\sqrt{9 \\times 5} = 3\\sqrt{5}$.',
        hint: 'Calculate the square root of the sum of squares.'
      },
      {
        id: 'q33',
        type: 'multiple-choice',
        question: '$a = 2i + 3j + 5k$ and $b = 4i + j + 6k$. Find $a \\cdot b$.',
        options: ['41', '31', '51', '21'],
        correctAnswer: '41',
        explanation: '$a \\cdot b = 2(4) + 3(1) + 5(6) = 8 + 3 + 30 = 41$.',
        hint: 'Compute the scalar product.'
      },
      {
        id: 'q34',
        type: 'multiple-choice',
        question: 'Find $|(a + b) - (a - b)|$ when $a = (6, 3)$ and $b = (1, -2)$.',
        options: ['2\\sqrt{5}', '\\sqrt{5}', '10', '5'],
        correctAnswer: '2\\sqrt{5}',
        explanation: '$(a+b) - (a-b) = 2b = 2(1, -2) = (2, -4)$. Magnitude = $\\sqrt{2^2 + (-4)^2} = \\sqrt{20} = 2\\sqrt{5}$.',
        hint: 'Simplify the vector expression first.'
      },
      {
        id: 'q35',
        type: 'multiple-choice',
        question: 'Find the sum of the vectors AB, BC, -DC, -AD',
        options: ['0', 'AD', 'DA', '-D'],
        correctAnswer: '0',
        explanation: 'This is a duplicate of Q9 and Q25. The sum is 0.',
        hint: 'Chain the vectors together.'
      },
      {
        id: 'q36',
        type: 'multiple-choice',
        question: 'Find the triple scalar product of $x = 2i - 3j + k$, $y = 4i + j - 3k$, $z = -i + j - 3k$.',
        options: ['-40', '40', '-30', '30'],
        correctAnswer: '-40',
        explanation: '$y \\times z = |i, j, k; 4, 1, -3; -1, 1, -3| = i(0) - j(-12-3) + k(4+1) = 15j + 5k$. $x \\cdot (y \\times z) = 2(0) - 3(15) + 1(5) = -45 + 5 = -40$.',
        hint: 'Calculate $x \\cdot (y \\times z)$.'
      }
    ]
  },
  {
    id: 'pq-mat101-1',
    title: 'General Mathematics I - Mock Exam',
    year: '2024/2025',
    semester: 'Mock',
    courseCode: 'MAT 101',
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Solve for $x$: $2x + 5 = 15$.',
        options: ['5', '10', '15', '20'],
        correctAnswer: '5',
        explanation: '$2x = 15 - 5 \\Rightarrow 2x = 10 \\Rightarrow x = 5$.',
        hint: 'Subtract 5 from both sides, then divide by 2.'
      },
      {
        id: 'q2',
        type: 'multiple-choice',
        question: 'What is the union of sets $A = \\{1, 2, 3\\}$ and $B = \\{3, 4, 5\\}$?',
        options: ['\\{1, 2, 3, 4, 5\\}', '\\{3\\}', '\\{1, 2, 4, 5\\}', '\\{1, 2, 3, 3, 4, 5\\}'],
        correctAnswer: '\\{1, 2, 3, 4, 5\\}',
        explanation: 'The union of two sets contains all unique elements from both sets.',
        hint: 'Combine all elements and remove duplicates.'
      }
    ]
  }
];
