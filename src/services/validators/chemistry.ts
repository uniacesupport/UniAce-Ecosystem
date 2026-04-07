import { Validator, ValidationResult } from './types';

export class ChemistryValidator implements Validator {
  async validate(input: string, topic: string): Promise<ValidationResult> {
    // Example: Basic check for chemical formula syntax
    // Ensure numbers in formulas (like H2O) are not followed by letters without a space
    // This is a simplified example.
    const formulaRegex = /[A-Z][a-z]?\d+[A-Z]/;
    if (formulaRegex.test(input)) {
      return {
        isValid: false,
        message: "It looks like your chemical formula might be formatted incorrectly.",
        correction: "Ensure that numbers in chemical formulas are properly subscripted or clearly separated."
      };
    }
    return { isValid: true };
  }
}
