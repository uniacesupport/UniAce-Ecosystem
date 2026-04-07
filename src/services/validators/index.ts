import { Validator } from './types';
import { ChemistryValidator } from './chemistry';

const registry: Record<string, Validator> = {
  'Chemistry': new ChemistryValidator(),
  // Add other subjects here
};

export const getValidator = (subject: string): Validator | undefined => {
  return registry[subject];
};
