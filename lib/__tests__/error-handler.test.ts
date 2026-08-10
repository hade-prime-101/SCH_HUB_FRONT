import { describe, it, expect } from 'vitest';
import { ErrorHandler } from '../error-handler';
import { ApiError } from '../error-types';

describe('ErrorHandler', () => {
  describe('classifyError', () => {
    it('should classify 400 as validation error', () => {
      const response = new Response('', { status: 400 });
      const error = ErrorHandler.classifyError(response);

      expect(error.status).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Please check your input and try again.');
      expect(error.isRetriable).toBe(false);
    });

    it('should classify 401 as authentication error', () => {
      const response = new Response('', { status: 401 });
      const error = ErrorHandler.classifyError(response);

      expect(error.status).toBe(401);
      expect(error.code).toBe('AUTHENTICATION_ERROR');
      expect(error.isRetriable).toBe(true);
    });

    it('should classify 403 as authorization error', () => {
      const response = new Response('', { status: 403 });
      const error = ErrorHandler.classifyError(response);

      expect(error.status).toBe(403);
      expect(error.code).toBe('AUTHORIZATION_ERROR');
      expect(error.isRetriable).toBe(false);
    });

    it('should classify 404 as not found error', () => {
      const response = new Response('', { status: 404 });
      const error = ErrorHandler.classifyError(response);

      expect(error.status).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.isRetriable).toBe(false);
    });

    it('should classify 408 as timeout error (retriable)', () => {
      const response = new Response('', { status: 408 });
      const error = ErrorHandler.classifyError(response);

      expect(error.status).toBe(408);
      expect(error.code).toBe('TIMEOUT_ERROR');
      expect(error.isRetriable).toBe(true);
    });

    it('should classify 429 as rate limit error (retriable)', () => {
      const response = new Response('', { status: 429 });
      const error = ErrorHandler.classifyError(response);

      expect(error.status).toBe(429);
      expect(error.code).toBe('RATE_LIMIT_ERROR');
      expect(error.isRetriable).toBe(true);
    });

    it('should classify 5xx as server error (retriable)', () => {
      const statuses = [500, 502, 503, 504];
      statuses.forEach(status => {
        const response = new Response('', { status });
        const error = ErrorHandler.classifyError(response);

        expect(error.status).toBe(status);
        expect(error.code).toBe('SERVER_ERROR');
        expect(error.isRetriable).toBe(true);
      });
    });

    it('should extract validation errors from 400 response', () => {
      const response = new Response('', { status: 400 });
      const body = {
        errors: {
          email: 'Invalid email format',
          password: 'Password too short'
        }
      };
      const error = ErrorHandler.classifyError(response, body);

      expect(error.validationErrors).toEqual({
        email: 'Invalid email format',
        password: 'Password too short'
      });
    });

    it('should extract validation errors from fieldErrors field', () => {
      const response = new Response('', { status: 400 });
      const body = {
        fieldErrors: {
          username: 'Already exists'
        }
      };
      const error = ErrorHandler.classifyError(response, body);

      expect(error.validationErrors).toEqual({
        username: 'Already exists'
      });
    });

    it('should handle array validation errors', () => {
      const response = new Response('', { status: 400 });
      const body = {
        errors: {
          email: ['Invalid email format', 'Already in use'],
          password: ['Too short']
        }
      };
      const error = ErrorHandler.classifyError(response, body);

      expect(error.validationErrors).toEqual({
        email: 'Invalid email format',  // Takes first element
        password: 'Too short'
      });
    });

    it('should not extract validation errors for non-400 responses', () => {
      const response = new Response('', { status: 500 });
      const body = {
        errors: {
          email: 'Invalid email'
        }
      };
      const error = ErrorHandler.classifyError(response, body);

      expect(error.validationErrors).toBeUndefined();
    });
  });

  describe('formatErrorForUI', () => {
    it('should format validation error with field-specific messages', () => {
      const error: ApiError = {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        validationErrors: {
          email: 'Invalid email format',
          password: 'Must be at least 8 characters'
        },
        isRetriable: false,
        retryCount: 0,
        errorId: 'test-id',
      };

      const formatted = ErrorHandler.formatErrorForUI(error);

      expect(formatted).toContain('Email: Invalid email format');
      expect(formatted).toContain('Password: Must be at least 8 characters');
    });

    it('should format field names from camelCase', () => {
      const error: ApiError = {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        validationErrors: {
          emailAddress: 'Invalid',
          confirmPassword: 'Does not match'
        },
        isRetriable: false,
        retryCount: 0,
        errorId: 'test-id',
      };

      const formatted = ErrorHandler.formatErrorForUI(error);

      expect(formatted).toContain('Email Address');
      expect(formatted).toContain('Confirm Password');
    });

    it('should format field names from snake_case', () => {
      const error: ApiError = {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        validationErrors: {
          full_name: 'Required',
          phone_number: 'Invalid format'
        },
        isRetriable: false,
        retryCount: 0,
        errorId: 'test-id',
      };

      const formatted = ErrorHandler.formatErrorForUI(error);

      expect(formatted).toContain('Full Name');
      expect(formatted).toContain('Phone Number');
    });

    it('should return general message for non-validation errors', () => {
      const error: ApiError = {
        status: 500,
        code: 'SERVER_ERROR',
        message: 'An error occurred on the server. Please try again later.',
        isRetriable: true,
        retryCount: 0,
        errorId: 'test-id',
      };

      const formatted = ErrorHandler.formatErrorForUI(error);

      expect(formatted).toBe('An error occurred on the server. Please try again later.');
    });

    it('should return general message for validation error without field details', () => {
      const error: ApiError = {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        validationErrors: {},
        isRetriable: false,
        retryCount: 0,
        errorId: 'test-id',
      };

      const formatted = ErrorHandler.formatErrorForUI(error);

      expect(formatted).toBe('Validation failed');
    });

    it('should handle single field error', () => {
      const error: ApiError = {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        validationErrors: {
          email: 'This email is already in use'
        },
        isRetriable: false,
        retryCount: 0,
        errorId: 'test-id',
      };

      const formatted = ErrorHandler.formatErrorForUI(error);

      expect(formatted).toBe('Email: This email is already in use');
    });

    it('should filter out sensitive data from messages', () => {
      const error: ApiError = {
        status: 401,
        code: 'AUTHENTICATION_ERROR',
        message: 'Your session has expired. Please log in again.',
        isRetriable: true,
        retryCount: 0,
        errorId: 'test-id',
      };

      const formatted = ErrorHandler.formatErrorForUI(error);

      expect(formatted).not.toContain('token');
      expect(formatted).not.toContain('password');
      expect(formatted).toBe('Your session has expired. Please log in again.');
    });

    it('should format 403 error without field details', () => {
      const error: ApiError = {
        status: 403,
        code: 'AUTHORIZATION_ERROR',
        message: 'You do not have permission to access this resource.',
        isRetriable: false,
        retryCount: 0,
        errorId: 'test-id',
      };

      const formatted = ErrorHandler.formatErrorForUI(error);

      expect(formatted).toBe('You do not have permission to access this resource.');
    });

    it('should format 404 error', () => {
      const error: ApiError = {
        status: 404,
        code: 'NOT_FOUND',
        message: 'The requested resource was not found.',
        isRetriable: false,
        retryCount: 0,
        errorId: 'test-id',
      };

      const formatted = ErrorHandler.formatErrorForUI(error);

      expect(formatted).toBe('The requested resource was not found.');
    });
  });

  describe('formatErrorForLogging', () => {
    it('should format error with all details', () => {
      const error: ApiError = {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        validationErrors: {
          email: 'Invalid format',
          password: 'Too short'
        },
        isRetriable: false,
        retryCount: 0,
        errorId: 'error-123',
      };

      const formatted = ErrorHandler.formatErrorForLogging(error);

      expect(formatted).toContain('ApiError [400] (VALIDATION_ERROR): Invalid input');
      expect(formatted).toContain('Field-level errors:');
      expect(formatted).toContain('email: Invalid format');
      expect(formatted).toContain('password: Too short');
    });

    it('should include retry count when > 0', () => {
      const error: ApiError = {
        status: 429,
        code: 'RATE_LIMIT_ERROR',
        message: 'Too many requests',
        isRetriable: true,
        retryCount: 2,
        errorId: 'error-456',
      };

      const formatted = ErrorHandler.formatErrorForLogging(error);

      expect(formatted).toContain('Retry count: 2');
    });

    it('should exclude sensitive data from logs', () => {
      const error: ApiError = {
        status: 401,
        code: 'AUTHENTICATION_ERROR',
        message: 'Authentication failed',
        isRetriable: true,
        retryCount: 0,
        errorId: 'error-789',
      };

      const formatted = ErrorHandler.formatErrorForLogging(error);

      expect(formatted).not.toContain('Bearer');
      expect(formatted).not.toContain('token');
    });
  });

  describe('shouldRetry', () => {
    it('should return true for retriable error with retries remaining', () => {
      const error: ApiError = {
        status: 429,
        code: 'RATE_LIMIT_ERROR',
        message: 'Too many requests',
        isRetriable: true,
        retryCount: 0,
        errorId: 'test-id',
      };

      expect(ErrorHandler.shouldRetry(error)).toBe(true);
    });

    it('should return false for non-retriable error', () => {
      const error: ApiError = {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        isRetriable: false,
        retryCount: 0,
        errorId: 'test-id',
      };

      expect(ErrorHandler.shouldRetry(error)).toBe(false);
    });

    it('should return false when max retries exceeded', () => {
      const error: ApiError = {
        status: 429,
        code: 'RATE_LIMIT_ERROR',
        message: 'Too many requests',
        isRetriable: true,
        retryCount: 3,  // Max retries reached
        errorId: 'test-id',
      };

      expect(ErrorHandler.shouldRetry(error)).toBe(false);
    });

    it('should return true at each retry level', () => {
      for (let i = 0; i < 3; i++) {
        const error: ApiError = {
          status: 500,
          code: 'SERVER_ERROR',
          message: 'Server error',
          isRetriable: true,
          retryCount: i,
          errorId: 'test-id',
        };

        expect(ErrorHandler.shouldRetry(error)).toBe(true);
      }
    });
  });

  describe('getBackoffDelay', () => {
    it('should return 2000ms for first retry (count 0)', () => {
      expect(ErrorHandler.getBackoffDelay(0)).toBe(2000);
    });

    it('should return 4000ms for second retry (count 1)', () => {
      expect(ErrorHandler.getBackoffDelay(1)).toBe(4000);
    });

    it('should return 8000ms for third retry (count 2)', () => {
      expect(ErrorHandler.getBackoffDelay(2)).toBe(8000);
    });

    it('should return 16000ms for fourth retry (count 3)', () => {
      expect(ErrorHandler.getBackoffDelay(3)).toBe(16000);
    });

    it('should return 32000ms (max) for retry count > 3', () => {
      expect(ErrorHandler.getBackoffDelay(4)).toBe(32000);
      expect(ErrorHandler.getBackoffDelay(5)).toBe(32000);
      expect(ErrorHandler.getBackoffDelay(100)).toBe(32000);
    });

    it('should return 32000ms (max) for negative retry count', () => {
      expect(ErrorHandler.getBackoffDelay(-1)).toBe(32000);
    });

    it('should follow exponential backoff sequence', () => {
      const delays = [
        ErrorHandler.getBackoffDelay(0),
        ErrorHandler.getBackoffDelay(1),
        ErrorHandler.getBackoffDelay(2),
        ErrorHandler.getBackoffDelay(3),
      ];

      expect(delays).toEqual([2000, 4000, 8000, 16000]);

      // Each delay should be double the previous (except the last one)
      for (let i = 1; i < delays.length - 1; i++) {
        expect(delays[i]).toBe(delays[i - 1] * 2);
      }
    });
  });
});
