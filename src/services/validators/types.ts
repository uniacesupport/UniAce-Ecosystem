export interface ValidationResult {
  isValid: boolean;
  message?: string;
  correction?: string;
}

export interface Validator {
  validate(input: string, topic: string): Promise<ValidationResult>;
}
