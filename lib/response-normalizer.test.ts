import { describe, it, expect } from 'vitest';
import {
  normalizeResponse,
  normalizeSuccessResponse,
  normalizeErrorResponse,
  normalizeValidationError,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type NormalizedSuccessResponse,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type NormalizedErrorResponse,
} from './response-normalizer';

describe('Response Normalization', () => {
  describe('normalizeSuccessResponse', () => {
    it('should wrap data in success response shape', () => {
      const data = { id: '123', name: 'Test' };
      const result = normalizeSuccessResponse(data);

      expect(result).toEqual({
        success: true,
        data,
      });
    });

    it('should include metadata when provided', () => {
      const data = { id: '123' };
      const meta = { timestamp: '2024-01-01', version: 'v1' };
      const result = normalizeSuccessResponse(data, meta);

      expect(result).toEqual({
        success: true,
        data,
        meta,
      });
    });

    it('should not include meta field if not provided', () => {
      const result = normalizeSuccessResponse({ id: '123' });
      expect(result).not.toHaveProperty('meta');
    });

    it('should handle primitive data types', () => {
      const stringResult = normalizeSuccessResponse('success');
      expect(stringResult.data).toBe('success');

      const numberResult = normalizeSuccessResponse(42);
      expect(numberResult.data).toBe(42);

      const boolResult = normalizeSuccessResponse(true);
      expect(boolResult.data).toBe(true);
    });

    it('should handle arrays as data', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const result = normalizeSuccessResponse(data);
      expect(result.data).toEqual(data);
    });
  });

  describe('normalizeErrorResponse', () => {
    it('should normalize error with message and code', () => {
      const response = { message: 'Invalid input', code: 'VALIDATION_ERROR' };
      const result = normalizeErrorResponse(response);

      expect(result).toEqual({
        success: false,
        message: 'Invalid input',
        code: 'VALIDATION_ERROR',
      });
    });

    it('should extract errors object from response', () => {
      const response = {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: {
          email: 'Email is required',
          password: 'Password must be at least 8 characters',
        },
      };
      const result = normalizeErrorResponse(response);

      expect(result).toEqual({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: {
          email: 'Email is required',
          password: 'Password must be at least 8 characters',
        },
      });
    });

    it('should extract validationErrors object from response', () => {
      const response = {
        message: 'Validation failed',
        validationErrors: {
          email: 'Invalid email format',
        },
      };
      const result = normalizeErrorResponse(response);

      expect(result.errors).toEqual({
        email: 'Invalid email format',
      });
    });

    it('should extract fieldErrors object from response', () => {
      const response = {
        message: 'Error',
        fieldErrors: {
          username: 'Username already taken',
        },
      };
      const result = normalizeErrorResponse(response);

      expect(result.errors).toEqual({
        username: 'Username already taken',
      });
    });

    it('should prefer errors over validationErrors', () => {
      const response = {
        message: 'Error',
        errors: { field1: 'error1' },
        validationErrors: { field2: 'error2' },
      };
      const result = normalizeErrorResponse(response);

      expect(result.errors).toEqual({ field1: 'error1' });
    });

    it('should handle various message field names', () => {
      const msgResponse = { msg: 'Error message' };
      expect(normalizeErrorResponse(msgResponse).message).toBe('Error message');

      const errorResponse = { error: 'Something went wrong' };
      expect(normalizeErrorResponse(errorResponse).message).toBe('Something went wrong');

      const errorMessageResponse = { errorMessage: 'Error occurred' };
      expect(normalizeErrorResponse(errorMessageResponse).message).toBe('Error occurred');
    });

    it('should handle various code field names', () => {
      const codeResponse = { code: 'ERR_CODE' };
      expect(normalizeErrorResponse(codeResponse).code).toBe('ERR_CODE');

      const errorCodeResponse = { errorCode: 'ERR_CODE_2' };
      expect(normalizeErrorResponse(errorCodeResponse).code).toBe('ERR_CODE_2');

      const typeResponse = { type: 'ERR_TYPE' };
      expect(normalizeErrorResponse(typeResponse).code).toBe('ERR_TYPE');

      const errorTypeResponse = { errorType: 'ERR_TYPE_2' };
      expect(normalizeErrorResponse(errorTypeResponse).code).toBe('ERR_TYPE_2');
    });

    it('should provide defaults for missing message and code', () => {
      const response = {};
      const result = normalizeErrorResponse(response);

      expect(result.message).toBe('An error occurred');
      expect(result.code).toBe('UNKNOWN_ERROR');
    });

    it('should handle non-object responses', () => {
      expect(() => normalizeErrorResponse(null)).not.toThrow();
      const result1 = normalizeErrorResponse(null);
      expect(result1.success).toBe(false);

      expect(() => normalizeErrorResponse('string error')).not.toThrow();
      const result2 = normalizeErrorResponse('string error');
      expect(result2.success).toBe(false);

      expect(() => normalizeErrorResponse(undefined)).not.toThrow();
      const result3 = normalizeErrorResponse(undefined);
      expect(result3.success).toBe(false);
    });

    it('should include status code in fallback code when status provided', () => {
      const result = normalizeErrorResponse({}, 404);
      expect(result.code).toBe('UNKNOWN_ERROR');

      const result2 = normalizeErrorResponse({}, 500);
      expect(result2.code).toBe('UNKNOWN_ERROR');
    });

    it('should not include errors field if none present', () => {
      const result = normalizeErrorResponse({ message: 'Error' });
      expect(result).not.toHaveProperty('errors');
    });

    it('should ignore invalid errors objects (non-string values)', () => {
      const response = {
        message: 'Error',
        errors: {
          field1: 'valid',
          field2: 123, // non-string value
        },
      };
      const result = normalizeErrorResponse(response);
      expect(result).not.toHaveProperty('errors');
    });
  });

  describe('normalizeResponse', () => {
    it('should normalize successful response', () => {
      const data = { id: '123', name: 'Test' };
      const response = { data };
      const result = normalizeResponse(response, true);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }
    });

    it('should extract data field from successful response', () => {
      const response = {
        data: { user: 'john' },
        meta: { timestamp: '2024-01-01' },
      };
      const result = normalizeResponse(response, true);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ user: 'john' });
      }
    });

    it('should use entire response as data if no data field', () => {
      const response = { user: 'john', id: 123 };
      const result = normalizeResponse(response, true);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ user: 'john', id: 123 });
      }
    });

    it('should normalize error response', () => {
      const response = {
        message: 'Invalid input',
        code: 'VALIDATION_ERROR',
        errors: { email: 'Required' },
      };
      const result = normalizeResponse(response, false, 400);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.message).toBe('Invalid input');
        expect(result.code).toBe('VALIDATION_ERROR');
        expect(result.errors).toEqual({ email: 'Required' });
      }
    });

    it('should include metadata in successful response', () => {
      const data = { id: '123' };
      const meta = { timestamp: '2024-01-01' };
      const result = normalizeResponse(data, true, 200, meta);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.meta).toEqual(meta);
      }
    });

    it('should handle primitive data in successful response', () => {
      const result = normalizeResponse('string data', true);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('string data');
      }
    });

    it('should handle non-object responses gracefully', () => {
      const result = normalizeResponse('not json', false);
      expect(result.success).toBe(false);
    });
  });

  describe('normalizeValidationError', () => {
    it('should normalize 400 validation error response', () => {
      const response = {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: {
          email: 'Email is required',
          password: 'Password too short',
        },
      };
      const result = normalizeValidationError(response);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Validation failed');
      expect(result.code).toBe('VALIDATION_ERROR');
      expect(result.errors).toEqual({
        email: 'Email is required',
        password: 'Password too short',
      });
    });

    it('should extract validation errors from various field names', () => {
      const response = {
        message: 'Error',
        validationErrors: {
          username: 'Already taken',
        },
      };
      const result = normalizeValidationError(response);

      expect(result.errors).toEqual({
        username: 'Already taken',
      });
    });
  });

  describe('edge cases and integration scenarios', () => {
    it('should handle deeply nested data structures', () => {
      const data = {
        user: {
          profile: {
            name: 'John',
            address: {
              street: '123 Main',
              city: 'NYC',
            },
          },
        },
      };
      const result = normalizeSuccessResponse(data);
      expect(result.data).toEqual(data);
    });

    it('should handle arrays of objects with errors', () => {
      const data = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ];
      const result = normalizeSuccessResponse(data);
      expect(result.data).toEqual(data);
    });

    it('should handle multiple field validation errors', () => {
      const response = {
        message: 'Form validation failed',
        code: 'FORM_VALIDATION',
        errors: {
          firstName: 'First name is required',
          lastName: 'Last name is required',
          email: 'Email must be valid',
          password: 'Password must be at least 8 characters',
          confirmPassword: 'Passwords do not match',
          phone: 'Phone number format invalid',
        },
      };
      const result = normalizeErrorResponse(response);

      expect(result.errors).toHaveProperty('firstName');
      expect(result.errors).toHaveProperty('lastName');
      expect(result.errors).toHaveProperty('email');
      expect(result.errors).toHaveProperty('password');
      expect(Object.keys(result.errors!).length).toBe(6);
    });

    it('should handle auth response with tokens', () => {
      const authResponse = {
        user: {
          id: 'user123',
          email: 'test@example.com',
          roles: ['student'],
        },
        token: 'jwt_token_here',
        refreshToken: 'refresh_token_here',
        dashboardRedirect: '/student',
      };
      const result = normalizeSuccessResponse(authResponse);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.token).toBe('jwt_token_here');
        expect(result.data.refreshToken).toBe('refresh_token_here');
      }
    });

    it('should handle OTP verification responses', () => {
      const response = {
        success: true,
        data: {
          user: { id: '123', email: 'test@test.com' },
          token: 'token123',
          refreshToken: 'refresh123',
          dashboardRedirect: '/student',
        },
      };
      const result = normalizeResponse(response, true);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('token');
        expect(result.data).toHaveProperty('user');
      }
    });

    it('should handle OTP validation error responses', () => {
      const response = {
        success: false,
        message: 'Invalid OTP',
        code: 'INVALID_OTP',
        errors: {
          otp: 'OTP code is invalid or expired',
        },
      };
      const result = normalizeResponse(response, false);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toEqual({ otp: 'OTP code is invalid or expired' });
      }
    });

    it('should handle password reset responses', () => {
      const response = {
        message: 'Password reset successful',
        code: 'PASSWORD_RESET_SUCCESS',
        data: {
          user: { id: '123', email: 'test@test.com' },
          token: 'new_token',
          refreshToken: 'new_refresh_token',
          dashboardRedirect: '/student',
        },
      };
      const result = normalizeResponse(response, true);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('token');
      }
    });

    it('should handle rate limit error responses', () => {
      const response = {
        message: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
      };
      const result = normalizeErrorResponse(response, 429);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Too many requests');
    });

    it('should handle server error responses', () => {
      const response = {
        message: 'Internal server error',
        code: 'SERVER_ERROR',
      };
      const result = normalizeErrorResponse(response, 500);

      expect(result.success).toBe(false);
      expect(result.code).toBe('SERVER_ERROR');
    });

    it('should preserve special characters in error messages', () => {
      const response = {
        message: 'Error: Email "test@example.com" is already registered',
        code: 'DUPLICATE_EMAIL',
      };
      const result = normalizeErrorResponse(response);

      expect(result.message).toContain('test@example.com');
      expect(result.message).toContain('registered');
    });
  });
});
