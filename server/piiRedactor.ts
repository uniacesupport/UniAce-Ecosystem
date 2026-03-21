
/**
 * Utility to redact Personally Identifiable Information (PII) from text.
 */

// Regex patterns for PII detection
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
// Simplified phone number pattern: matches 10-digit formats with optional separators
const PHONE_REGEX = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;

/**
 * Redacts PII from the given text.
 * @param text The input text to redact.
 * @returns The redacted text.
 */
export function redactPII(text: string): string {
  if (!text) return text;

  let redactedText = text;

  // Mask Emails
  redactedText = redactedText.replace(EMAIL_REGEX, '[EMAIL_REDACTED]');

  // Mask Phone Numbers
  redactedText = redactedText.replace(PHONE_REGEX, '[PHONE_REDACTED]');

  // Note: Physical address detection is highly context-dependent and prone to 
  // false positives with regex. For a robust solution, consider a dedicated 
  // NLP-based PII detection library.

  return redactedText;
}
