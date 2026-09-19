let mathInstance: any = null;

async function getMath() {
  if (!mathInstance) {
    const { create, all } = await import('mathjs');
    mathInstance = create(all);
  }
  return mathInstance;
}

export const MathEngine = {
  evaluate: async (expression: string): Promise<any> => {
    try {
      const math = await getMath();
      return math.evaluate(expression);
    } catch (error) {
      console.error('MathEngine evaluation error:', error);
      return null;
    }
  },
  
  compare: async (expr1: string, expr2: string): Promise<boolean> => {
    try {
      const math = await getMath();
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
