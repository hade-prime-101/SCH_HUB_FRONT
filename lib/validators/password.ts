/**
 * Result of password validation including strength assessment
 */
export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong';
}

/**
 * Options for password validation
 */
export interface PasswordValidationOptions {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
}

/**
 * Validates a password against security requirements and calculates strength.
 * Default requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
 *
 * @param password - The password to validate
 * @param options - Optional validation options (defaults to standard security requirements)
 * @returns PasswordValidationResult with validation status, list of errors, and strength rating
 *
 * @example
 * const result = validatePassword('MyPass123!');
 * if (!result.valid) {
 *   result.errors.forEach(error => console.log(error));
 * }
 * console.log(`Strength: ${result.strength}`);
 */
export function validatePassword(
  password: string,
  options: PasswordValidationOptions = {}
): PasswordValidationResult {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
  } = options;

  const errors: string[] = [];

  // Check if password is empty
  if (!password) {
    return {
      valid: false,
      errors: ['Password is required'],
      strength: 'weak',
    };
  }

  // Check minimum length
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }

  // Check for uppercase letter
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check for lowercase letter
  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check for number
  if (requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for special character
  if (requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Calculate strength based on criteria met
  const strength = calculatePasswordStrength(password, {
    minLength,
    requireUppercase,
    requireLowercase,
    requireNumbers,
    requireSpecialChars,
  });

  return {
    valid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Calculate password strength level based on criteria met
 *
 * @internal
 */
function calculatePasswordStrength(
  password: string,
  options: PasswordValidationOptions
): 'weak' | 'fair' | 'good' | 'strong' {
  let score = 0;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const maxScore = 5;

  // Length score (0-2 points)
  if (password.length >= (options.minLength || 8)) {
    score += 1;
  }
  if (password.length >= 12) {
    score += 1;
  }

  // Character variety score (0-3 points)
  if (options.requireUppercase && /[A-Z]/.test(password)) {
    score += 1;
  }
  if (options.requireNumbers && /[0-9]/.test(password)) {
    score += 1;
  }
  if (options.requireSpecialChars && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1;
  }

  // Determine strength based on score
  if (score <= 1) {
    return 'weak';
  } else if (score <= 2) {
    return 'fair';
  } else if (score <= 3) {
    return 'good';
  } else {
    return 'strong';
  }
}
