import { create, all } from 'mathjs';

const math = create(all);

export const MathEngine = {
  evaluate: (expression: string): any => {
    try {
      return math.evaluate(expression);
    } catch (error) {
      console.error('MathEngine evaluation error:', error);
      return null;
    }
  },
  
  compare: (expr1: string, expr2: string): boolean => {
    try {
      const val1 = math.evaluate(expr1);
      const val2 = math.evaluate(expr2);
      const result = math.equal(val1, val2);
      return typeof result === 'boolean' ? result : false;
    } catch (error) {
      console.error('MathEngine comparison error:', error);
      return false;
    }
  }
};
