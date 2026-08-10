import { ValidationResult } from '@/types/auth';

/**
 * Validates an email address format using RFC 5322 compatible regex.
 * Returns a ValidationResult with valid status and optional error message.
 *
 * @param email - The email address to validate
 * @returns ValidationResult object with valid flag and optional error message
 *
 * @example
 * const result = validateEmail('user@example.com');
 * if (!result.valid) console.log(result.error);
 */
export function validateEmail(email: string): ValidationResult {
  // Trim whitespace
  const trimmedEmail = email.trim();

  // Check if email is empty
  if (!trimmedEmail) {
    return {
      valid: false,
      error: 'Email is required',
    };
  }

  // RFC 5322 simplified regex pattern
  // Matches most common email formats
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmedEmail)) {
    return {
      valid: false,
      error: 'Please enter a valid email address',
    };
  }

  // Additional validation: check length
  if (trimmedEmail.length > 254) {
    return {
      valid: false,
      error: 'Email address is too long',
    };
  }

  // Check local part (before @) length
  const [localPart] = trimmedEmail.split('@');
  if (localPart.length > 64) {
    return {
      valid: false,
      error: 'Email local part is too long',
    };
  }

  return {
    valid: true,
  };
}
