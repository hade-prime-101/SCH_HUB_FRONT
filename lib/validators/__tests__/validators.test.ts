import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePassword,
  validateForm,
  createFormValidator,
  validateFormFields,
  hasFormErrors,
  getFormErrorCount,
  clearFormFieldErrors,
  mergeValidationSchemas,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validatePattern,
  validateOneOf,
  validateNumber,
  validateRange,
  validateMatches,
  validateAlphanumeric,
  validateUrl,
  composeValidators,
} from '../index';
import type { FormValidationSchema } from '../form';

// ============================================================================
// EMAIL VALIDATOR TESTS
// ============================================================================

describe('Email Validator', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.co.uk',
        'first+last@example.com',
        'user123@test.org',
      ];

      validEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'notanemail',
        'user@',
        '@example.com',
        'user@.com',
        'user @example.com',
      ];

      invalidEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it('should reject empty email', () => {
      const result = validateEmail('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Email is required');
    });

    it('should reject email exceeding 254 characters', () => {
      const longEmail = 'a'.repeat(250) + '@a.co';
      const result = validateEmail(longEmail);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Email address is too long');
    });

    it('should reject email with local part exceeding 64 characters', () => {
      const emailWithLongLocalPart = 'a'.repeat(65) + '@example.com';
      const result = validateEmail(emailWithLongLocalPart);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Email local part is too long');
    });

    it('should trim whitespace from email', () => {
      const result = validateEmail('  user@example.com  ');
      expect(result.valid).toBe(true);
    });

    it('should return appropriate error messages', () => {
      const result = validateEmail('invalid');
      expect(result.error).toBe('Please enter a valid email address');
    });
  });
});

// ============================================================================
// PASSWORD VALIDATOR TESTS
// ============================================================================

describe('Password Validator', () => {
  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'MyPassword123!',
        'SecurePass@2024',
        'Complex#Pass1',
        'AnotherOne@123',
      ];

      strongPasswords.forEach((password) => {
        const result = validatePassword(password);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(['good', 'strong']).toContain(result.strength);
      });
    });

    it('should reject password shorter than 8 characters', () => {
      const result = validatePassword('Short1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Password must be at least 8 characters long'
      );
    });

    it('should reject password without uppercase letter', () => {
      const result = validatePassword('lowercase123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one uppercase letter'
      );
    });

    it('should reject password without lowercase letter', () => {
      const result = validatePassword('UPPERCASE123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one lowercase letter'
      );
    });

    it('should reject password without number', () => {
      const result = validatePassword('NoNumbers!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one number'
      );
    });

    it('should reject password without special character', () => {
      const result = validatePassword('NoSpecial123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one special character'
      );
    });

    it('should reject empty password', () => {
      const result = validatePassword('');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password is required');
      expect(result.strength).toBe('weak');
    });

    it('should return multiple errors for multiple violations', () => {
      const result = validatePassword('short');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('should calculate strength correctly', () => {
      const weak = validatePassword('weak');
      expect(weak.strength).toBe('weak');

      const fair = validatePassword('Fair1!');
      expect(fair.strength).toBe('fair');

      const good = validatePassword('Good123!');
      expect(good.strength).toBe('good');

      const strong = validatePassword('VeryStrong123!@');
      expect(strong.strength).toBe('strong');
    });

    it('should accept custom validation options', () => {
      const result = validatePassword('short', { minLength: 5 });
      expect(result.valid).toBe(false);
      // Should not complain about length since 5 chars meet min of 5
      expect(result.errors).not.toContain(
        'Password must be at least 5 characters long'
      );
    });

    it('should skip validation checks when disabled in options', () => {
      const result = validatePassword('nospecial123', {
        requireSpecialChars: false,
      });
      expect(result.errors).not.toContain(
        'Password must contain at least one special character'
      );
    });

    it('should provide list of failures not just valid/invalid flag', () => {
      const result = validatePassword('abc');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// FIELD VALIDATORS TESTS
// ============================================================================

describe('Field Validators', () => {
  describe('validateRequired', () => {
    it('should pass for non-empty values', () => {
      expect(validateRequired('value')).toBeUndefined();
      expect(validateRequired('0')).toBeUndefined();
      expect(validateRequired(false)).toBeUndefined();
    });

    it('should fail for empty/null/undefined values', () => {
      expect(validateRequired('')).toBeDefined();
      expect(validateRequired(null)).toBeDefined();
      expect(validateRequired(undefined)).toBeDefined();
    });

    it('should use custom field name in error message', () => {
      const error = validateRequired('', 'Username');
      expect(error).toBe('Username is required');
    });
  });

  describe('validateMinLength', () => {
    it('should pass for strings meeting minimum length', () => {
      const validator = validateMinLength(5, 'Password');
      expect(validator('hello')).toBeUndefined();
      expect(validator('hello world')).toBeUndefined();
    });

    it('should fail for strings below minimum length', () => {
      const validator = validateMinLength(5, 'Password');
      expect(validator('hi')).toBeDefined();
    });

    it('should skip validation for null/undefined', () => {
      const validator = validateMinLength(5, 'Field');
      expect(validator(null)).toBeUndefined();
      expect(validator(undefined)).toBeUndefined();
    });
  });

  describe('validateMaxLength', () => {
    it('should pass for strings within maximum length', () => {
      const validator = validateMaxLength(5, 'Username');
      expect(validator('hi')).toBeUndefined();
      expect(validator('hello')).toBeUndefined();
    });

    it('should fail for strings exceeding maximum length', () => {
      const validator = validateMaxLength(5, 'Username');
      expect(validator('toolong')).toBeDefined();
    });
  });

  describe('validatePattern', () => {
    it('should validate values matching pattern', () => {
      const validator = validatePattern(/^[a-z]+$/, 'Username');
      expect(validator('abc')).toBeUndefined();
      expect(validator('ABC')).toBeDefined();
    });

    it('should skip validation for empty values', () => {
      const validator = validatePattern(/^[a-z]+$/, 'Field');
      expect(validator('')).toBeUndefined();
      expect(validator(null)).toBeUndefined();
    });

    it('should use custom error message', () => {
      const validator = validatePattern(/^[a-z]+$/, 'Field', 'Must be lowercase');
      const error = validator('ABC');
      expect(error).toBe('Must be lowercase');
    });
  });

  describe('validateOneOf', () => {
    it('should pass for values in allowed list', () => {
      const validator = validateOneOf(['admin', 'user', 'guest'], 'Role');
      expect(validator('admin')).toBeUndefined();
      expect(validator('user')).toBeUndefined();
    });

    it('should fail for values not in allowed list', () => {
      const validator = validateOneOf(['admin', 'user', 'guest'], 'Role');
      expect(validator('invalid')).toBeDefined();
    });

    it('should include allowed values in error message', () => {
      const validator = validateOneOf(['a', 'b'], 'Field');
      const error = validator('c');
      expect(error).toContain('a');
      expect(error).toContain('b');
    });
  });

  describe('validateNumber', () => {
    it('should pass for valid numbers', () => {
      const validator = validateNumber('Age');
      expect(validator('123')).toBeUndefined();
      expect(validator('-5')).toBeUndefined();
      expect(validator('3.14')).toBeUndefined();
    });

    it('should fail for non-numeric values', () => {
      const validator = validateNumber('Age');
      expect(validator('abc')).toBeDefined();
    });

    it('should skip validation for empty values', () => {
      const validator = validateNumber('Field');
      expect(validator('')).toBeUndefined();
      expect(validator(null)).toBeUndefined();
    });
  });

  describe('validateRange', () => {
    it('should pass for numbers within range', () => {
      const validator = validateRange(0, 100, 'Score');
      expect(validator('50')).toBeUndefined();
      expect(validator(0)).toBeUndefined();
      expect(validator(100)).toBeUndefined();
    });

    it('should fail for numbers outside range', () => {
      const validator = validateRange(0, 100, 'Score');
      expect(validator(-1)).toBeDefined();
      expect(validator(101)).toBeDefined();
    });

    it('should include range in error message', () => {
      const validator = validateRange(0, 100, 'Score');
      const error = validator(150);
      expect(error).toContain('0');
      expect(error).toContain('100');
    });
  });

  describe('validateMatches', () => {
    it('should pass when values match', () => {
      const validator = validateMatches('password123', 'Confirm Password');
      expect(validator('password123')).toBeUndefined();
    });

    it('should fail when values do not match', () => {
      const validator = validateMatches('password123', 'Confirm Password');
      expect(validator('different')).toBeDefined();
    });
  });

  describe('validateAlphanumeric', () => {
    it('should pass for alphanumeric strings', () => {
      const validator = validateAlphanumeric('Username');
      expect(validator('user123')).toBeUndefined();
      expect(validator('ABC')).toBeUndefined();
    });

    it('should fail for strings with special characters', () => {
      const validator = validateAlphanumeric('Username');
      expect(validator('user@123')).toBeDefined();
      expect(validator('user-name')).toBeDefined();
    });
  });

  describe('validateUrl', () => {
    it('should pass for valid URLs', () => {
      const validator = validateUrl('Website');
      expect(validator('https://example.com')).toBeUndefined();
      expect(validator('http://test.org')).toBeUndefined();
    });

    it('should fail for invalid URLs', () => {
      const validator = validateUrl('Website');
      expect(validator('not a url')).toBeDefined();
      expect(validator('example.com')).toBeDefined();
    });
  });

  describe('composeValidators', () => {
    it('should apply multiple validators in order', () => {
      const validator = composeValidators(
        (v) => !v ? 'Required' : undefined,
        (v) => v.length < 5 ? 'Too short' : undefined,
        (v) => !/^[a-z]+$/.test(v) ? 'Must be lowercase' : undefined
      );

      expect(validator('ab')).toBe('Too short');
      expect(validator('abcde')).toBeUndefined();
    });

    it('should return first error encountered', () => {
      const validator = composeValidators(
        (v) => !v ? 'Required' : undefined,
        (v) => v.length < 5 ? 'Too short' : undefined,
      );

      const error = validator('ab');
      expect(error).toBe('Too short');
    });
  });
});

// ============================================================================
// FORM VALIDATOR TESTS
// ============================================================================

describe('Form Validators', () => {
  describe('validateForm', () => {
    it('should validate all fields in schema', () => {
      const schema: FormValidationSchema<{ email: string; password: string }> = {
        email: validateEmail,
        password: validatePassword,
      };

      const errors = validateForm(
        { email: 'invalid', password: 'weak' },
        schema
      );

      expect(errors.email).toBeDefined();
      expect(errors.password).toBeDefined();
    });

    it('should return empty object when all valid', () => {
      const schema: FormValidationSchema<{ email: string; password: string }> = {
        email: validateEmail,
        password: validatePassword,
      };

      const errors = validateForm(
        { email: 'user@example.com', password: 'MyPassword123!' },
        schema
      );

      expect(Object.keys(errors).length).toBe(0);
    });

    it('should support multiple validators per field', () => {
      const schema: FormValidationSchema<{ username: string }> = {
        username: [
          (v) => !v ? 'Required' : undefined,
          (v) => v.length < 3 ? 'Too short' : undefined,
        ],
      };

      const errors = validateForm({ username: '' }, schema);
      expect(errors.username).toBe('Required');

      const errors2 = validateForm({ username: 'ab' }, schema);
      expect(errors2.username).toBe('Too short');
    });

    it('should stop at first error per field', () => {
      const validators = [
        () => 'First error',
        () => 'Second error',
      ];

      const schema: FormValidationSchema<{ field: string }> = {
        field: validators,
      };

      const errors = validateForm({ field: 'value' }, schema);
      expect(errors.field).toBe('First error');
    });
  });

  describe('createFormValidator', () => {
    it('should create reusable validator', () => {
      const schema: FormValidationSchema<{ email: string; password: string }> = {
        email: validateEmail,
        password: validatePassword,
      };

      const validator = createFormValidator(schema);
      const errors = validator({
        email: 'user@example.com',
        password: 'MyPassword123!',
      });

      expect(Object.keys(errors).length).toBe(0);
    });
  });

  describe('validateFormFields', () => {
    it('should validate only specified fields', () => {
      const schema: FormValidationSchema<{ email: string; password: string; name: string }> = {
        email: validateEmail,
        password: validatePassword,
        name: validateRequired,
      };

      const errors = validateFormFields(
        { email: 'invalid', password: 'weak', name: '' },
        schema,
        ['email', 'password']
      );

      expect(errors.email).toBeDefined();
      expect(errors.password).toBeDefined();
      expect(errors.name).toBeUndefined();
    });

    it('should validate all fields when fieldNames not provided', () => {
      const schema: FormValidationSchema<{ email: string; password: string }> = {
        email: validateEmail,
        password: validatePassword,
      };

      const errors = validateFormFields(
        { email: 'invalid', password: 'weak' },
        schema
      );

      expect(errors.email).toBeDefined();
      expect(errors.password).toBeDefined();
    });
  });

  describe('hasFormErrors', () => {
    it('should return true when errors exist', () => {
      const errors = { email: 'Invalid email' };
      expect(hasFormErrors(errors)).toBe(true);
    });

    it('should return false when no errors', () => {
      const errors = {};
      expect(hasFormErrors(errors)).toBe(false);
    });

    it('should ignore undefined and empty string errors', () => {
      const errors = { email: undefined, password: '' };
      expect(hasFormErrors(errors)).toBe(false);
    });
  });

  describe('getFormErrorCount', () => {
    it('should count errors correctly', () => {
      const errors = { email: 'Error1', password: 'Error2', name: 'Error3' };
      expect(getFormErrorCount(errors)).toBe(3);
    });

    it('should return 0 for no errors', () => {
      const errors = {};
      expect(getFormErrorCount(errors)).toBe(0);
    });

    it('should ignore undefined and empty string errors', () => {
      const errors = { email: 'Error', password: undefined, name: '' };
      expect(getFormErrorCount(errors)).toBe(1);
    });
  });

  describe('clearFormFieldErrors', () => {
    it('should clear specified field errors', () => {
      const errors = {
        email: 'Error1',
        password: 'Error2',
        name: 'Error3',
      };

      const cleared = clearFormFieldErrors(errors, ['email', 'name']);
      expect(cleared.email).toBeUndefined();
      expect(cleared.password).toBe('Error2');
      expect(cleared.name).toBeUndefined();
    });

    it('should not modify original errors object', () => {
      const errors = { email: 'Error' };
      clearFormFieldErrors(errors, ['email']);
      expect(errors.email).toBe('Error');
    });
  });

  describe('mergeValidationSchemas', () => {
    it('should merge multiple schemas', () => {
      const schema1: FormValidationSchema<{ email: string }> = {
        email: validateEmail,
      };
      const schema2: FormValidationSchema<{ password: string }> = {
        password: validatePassword,
      };

      const merged = mergeValidationSchemas(schema1, schema2);
      expect(merged.email).toBeDefined();
      expect(merged.password).toBeDefined();
    });

    it('should allow later schemas to override earlier ones', () => {
      const validator1 = () => 'Error1';
      const validator2 = () => 'Error2';

      const schema1: FormValidationSchema<{ field: string }> = {
        field: validator1,
      };
      const schema2: FormValidationSchema<{ field: string }> = {
        field: validator2,
      };

      const merged = mergeValidationSchemas(schema1, schema2);
      const errors = validateForm({ field: 'value' }, merged);
      expect(errors.field).toBe('Error2');
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Validator Integration', () => {
  it('should work with complete login form validation', () => {
    const schema: FormValidationSchema<{ email: string; password: string }> = {
      email: validateEmail,
      password: validatePassword,
    };

    const validErrors = validateForm(
      { email: 'user@example.com', password: 'MyPassword123!' },
      schema
    );
    expect(hasFormErrors(validErrors)).toBe(false);

    const invalidErrors = validateForm(
      { email: 'invalid', password: 'weak' },
      schema
    );
    expect(hasFormErrors(invalidErrors)).toBe(true);
    expect(getFormErrorCount(invalidErrors)).toBe(2);
  });

  it('should work with registration form validation', () => {
    const schema: FormValidationSchema<{
      username: string;
      email: string;
      password: string;
      confirmPassword: string;
    }> = {
      username: composeValidators(
        validateRequired('Username'),
        validateMinLength(3, 'Username')
      ),
      email: validateEmail,
      password: validatePassword,
      confirmPassword: [
        validateRequired('Confirm Password'),
        (value) => {
          // This would be connected to actual password field
          return value === 'MyPassword123!' ? undefined : 'Passwords do not match';
        },
      ],
    };

    const values = {
      username: 'john_doe',
      email: 'john@example.com',
      password: 'MyPassword123!',
      confirmPassword: 'MyPassword123!',
    };

    const errors = validateForm(values, schema);
    expect(hasFormErrors(errors)).toBe(false);
  });

  it('should provide clear error messages for user feedback', () => {
    const schema: FormValidationSchema<{ email: string; password: string }> = {
      email: validateEmail,
      password: validatePassword,
    };

    const errors = validateForm(
      { email: 'notanemail', password: '123' },
      schema
    );

    expect(errors.email).toBe('Please enter a valid email address');
    expect(errors.password).toContain('at least 8 characters');
  });
});
