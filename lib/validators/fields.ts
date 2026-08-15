/**
 * Validator function type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FieldValidator = (value: any) => string | undefined;

/**
 * Validates that a field value is not empty.
 *
 * Can be used in two ways:
 *   1. As a factory (curried): `validateRequired('FieldName')` → returns a FieldValidator
 *   2. As a direct call:       `validateRequired(value, 'FieldName')` → returns string | undefined
 *
 * @example
 * // Factory usage (for schemas / composeValidators)
 * composeValidators(validateRequired('Email'), validateMinLength(5, 'Email'))
 *
 * // Direct usage
 * const error = validateRequired(email, 'Email');
 */
export function validateRequired(fieldName?: string): FieldValidator;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateRequired(value: any, fieldName?: string): string | undefined;
export function validateRequired(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  valueOrFieldName?: any,
  fieldName?: string,
): FieldValidator | string | undefined {
  // Called as factory: validateRequired('FieldName') or validateRequired()
  // Detect factory call: single arg that is a string (treated as fieldName), or no args
  if (fieldName === undefined && (valueOrFieldName === undefined || typeof valueOrFieldName === 'string')) {
    const name = valueOrFieldName ?? 'Field';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (value: any): string | undefined => {
      if (value === null || value === undefined || value === '') {
        return `${name} is required`;
      }
      return undefined;
    };
  }
  // Called directly: validateRequired(value, 'FieldName')
  const name = fieldName ?? 'Field';
  const value = valueOrFieldName;
  if (value === null || value === undefined || value === '') {
    return `${name} is required`;
  }
  return undefined;
}

/**
 * Validates that a string meets minimum length requirement
 *
 * @param minLength - Minimum required length
 * @param fieldName - Optional name of the field for error message
 * @returns Validator function
 *
 * @example
 * const validator = validateMinLength(8, 'Password');
 * const error = validator('short');
 * if (error) console.log(error); // "Password must be at least 8 characters long"
 */
export function validateMinLength(
  minLength: number,
  fieldName: string = 'Field'
): FieldValidator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (value: any): string | undefined => {
    if (value === null || value === undefined) {
      return undefined; // Let validateRequired handle empty values
    }
    const stringValue = String(value);
    if (stringValue.length < minLength) {
      return `${fieldName} must be at least ${minLength} characters long`;
    }
    return undefined;
  };
}

/**
 * Validates that a string meets maximum length requirement
 *
 * @param maxLength - Maximum allowed length
 * @param fieldName - Optional name of the field for error message
 * @returns Validator function
 *
 * @example
 * const validator = validateMaxLength(50, 'Username');
 * const error = validator('a'.repeat(51));
 * if (error) console.log(error); // "Username must be no more than 50 characters long"
 */
export function validateMaxLength(
  maxLength: number,
  fieldName: string = 'Field'
): FieldValidator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (value: any): string | undefined => {
    if (value === null || value === undefined) {
      return undefined;
    }
    const stringValue = String(value);
    if (stringValue.length > maxLength) {
      return `${fieldName} must be no more than ${maxLength} characters long`;
    }
    return undefined;
  };
}

/**
 * Validates that a value matches a regex pattern
 *
 * @param pattern - Regex pattern to match
 * @param fieldName - Optional name of the field for error message
 * @param message - Optional custom error message
 * @returns Validator function
 *
 * @example
 * const validator = validatePattern(/^[a-z]+$/, 'Username', 'Username must contain only lowercase letters');
 * const error = validator('invalid123');
 * if (error) console.log(error);
 */
export function validatePattern(
  pattern: RegExp,
  fieldName: string = 'Field',
  message?: string
): FieldValidator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (value: any): string | undefined => {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    const stringValue = String(value);
    if (!pattern.test(stringValue)) {
      return message || `${fieldName} format is invalid`;
    }
    return undefined;
  };
}

/**
 * Validates that a value is in a list of allowed values
 *
 * @param allowedValues - Array of allowed values
 * @param fieldName - Optional name of the field for error message
 * @returns Validator function
 *
 * @example
 * const validator = validateOneOf(['admin', 'user', 'guest'], 'Role');
 * const error = validator('invalid');
 * if (error) console.log(error); // "Role must be one of: admin, user, guest"
 */
export function validateOneOf(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allowedValues: any[],
  fieldName: string = 'Field'
): FieldValidator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (value: any): string | undefined => {
    if (value === null || value === undefined) {
      return undefined;
    }
    if (!allowedValues.includes(value)) {
      return `${fieldName} must be one of: ${allowedValues.join(', ')}`;
    }
    return undefined;
  };
}

/**
 * Validates that a value is a valid number
 *
 * @param fieldName - Optional name of the field for error message
 * @returns Validator function
 *
 * @example
 * const validator = validateNumber('Age');
 * const error = validator('abc');
 * if (error) console.log(error); // "Age must be a valid number"
 */
export function validateNumber(fieldName: string = 'Field'): FieldValidator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (value: any): string | undefined => {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    const num = Number(value);
    if (isNaN(num)) {
      return `${fieldName} must be a valid number`;
    }
    return undefined;
  };
}

/**
 * Validates that a number is within a range
 *
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @param fieldName - Optional name of the field for error message
 * @returns Validator function
 *
 * @example
 * const validator = validateRange(0, 100, 'Score');
 * const error = validator(150);
 * if (error) console.log(error); // "Score must be between 0 and 100"
 */
export function validateRange(
  min: number,
  max: number,
  fieldName: string = 'Field'
): FieldValidator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (value: any): string | undefined => {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    const num = Number(value);
    if (isNaN(num)) {
      return `${fieldName} must be a valid number`;
    }
    if (num < min || num > max) {
      return `${fieldName} must be between ${min} and ${max}`;
    }
    return undefined;
  };
}

/**
 * Validates that two values match (e.g., password confirmation)
 *
 * @param compareValue - Value to compare against
 * @param fieldName - Optional name of the field for error message
 * @returns Validator function
 *
 * @example
 * const validator = validateMatches(password, 'Confirm Password');
 * const error = validator(confirmPassword);
 * if (error) console.log(error); // "Confirm Password must match Password"
 */
export function validateMatches(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  compareValue: any,
  fieldName: string = 'Field'
): FieldValidator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (value: any): string | undefined => {
    if (value !== compareValue) {
      return `${fieldName} must match`;
    }
    return undefined;
  };
}

/**
 * Validates that a string contains only alphanumeric characters
 *
 * @param fieldName - Optional name of the field for error message
 * @returns Validator function
 *
 * @example
 * const validator = validateAlphanumeric('Username');
 * const error = validator('user@123');
 * if (error) console.log(error); // "Username must contain only alphanumeric characters"
 */
export function validateAlphanumeric(fieldName: string = 'Field'): FieldValidator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (value: any): string | undefined => {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    const stringValue = String(value);
    if (!/^[a-zA-Z0-9]+$/.test(stringValue)) {
      return `${fieldName} must contain only alphanumeric characters`;
    }
    return undefined;
  };
}

/**
 * Validates that a value is a valid URL
 *
 * @param fieldName - Optional name of the field for error message
 * @returns Validator function
 *
 * @example
 * const validator = validateUrl('Website');
 * const error = validator('not-a-url');
 * if (error) console.log(error); // "Website must be a valid URL"
 */
export function validateUrl(fieldName: string = 'Field'): FieldValidator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (value: any): string | undefined => {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    try {
      new URL(String(value));
      return undefined;
    } catch {
      return `${fieldName} must be a valid URL`;
    }
  };
}

/**
 * Composes multiple validators into a single validator
 * Returns error from first validator that fails
 *
 * @param validators - Array of validator functions to compose
 * @returns Combined validator function
 *
 * @example
 * const validator = composeValidators(
 *   validateRequired('Email'),
 *   validateMinLength(5, 'Email'),
 *   validateEmail
 * );
 * const error = validator(email);
 */
export function composeValidators(...validators: FieldValidator[]): FieldValidator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (value: any): string | undefined => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) {
        return error;
      }
    }
    return undefined;
  };
}
