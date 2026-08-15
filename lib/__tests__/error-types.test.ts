import { describe, it, expect } from 'vitest';
import { createApiError, validateApiError, ApiError } from '../error-types';

describe('ApiError Types and Validation', () => {
  describe('createApiError', () => {
    it('should create a valid ApiError with all required fields', () => {
      const error = createApiError(
        400,
        'VALIDATION_ERROR',
        'Invalid input',
        { email: 'Invalid email' },
        false,
        0
      );

      expect(error.status).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Invalid input');
      expect(error.validationErrors).toEqual({ email: 'Invalid email' });
      expect(error.isRetriable).toBe(false);
      expect(error.retryCount).toBe(0);
      expect(error.errorId).toBeDefined();
      expect(typeof error.errorId).toBe('string');
      expect(error.errorId.length).toBeGreaterThan(0);
    });

    it('should generate unique error IDs', () => {
      const error1 = createApiError(400, 'ERROR', 'msg', undefined, false, 0);
      const error2 = createApiError(400, 'ERROR', 'msg', undefined, false, 0);
      
      expect(error1.errorId).not.toBe(error2.errorId);
    });

    it('should create retriable errors', () => {
      const error = createApiError(429, 'RATE_LIMIT', 'Too many requests', undefined, true, 1);
      
      expect(error.isRetriable).toBe(true);
      expect(error.retryCount).toBe(1);
    });

    it('should handle optional validation errors', () => {
      const error = createApiError(500, 'SERVER_ERROR', 'Internal server error', undefined, true, 0);
      
      expect(error.validationErrors).toBeUndefined();
    });
  });

  describe('validateApiError', () => {
    it('should validate a properly formed ApiError', () => {
      const error = createApiError(400, 'VALIDATION_ERROR', 'Invalid input', undefined, false, 0);
      
      expect(validateApiError(error)).toBe(true);
    });

    it('should reject null or non-object errors', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(validateApiError(null as any)).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(validateApiError(undefined as any)).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(validateApiError('error' as any)).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(validateApiError(123 as any)).toBe(false);
    });

    it('should reject invalid status codes', () => {
      const error: ApiError = {
        status: 999,  // Invalid
        message: 'Test',
        code: 'TEST',
        isRetriable: false,
        retryCount: 0,
        errorId: 'test-id',
      };
      
      expect(validateApiError(error)).toBe(false);
    });

    it('should reject missing required fields', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error: any = {
        status: 400,
        code: 'TEST',
        isRetriable: false,
        retryCount: 0,
        errorId: 'test-id',
        // message is missing
      };
      
      expect(validateApiError(error)).toBe(false);
    });

    it('should reject empty message', () => {
      const error: ApiError = {
        status: 400,
        message: '',  // Empty
        code: 'TEST',
        isRetriable: false,
        retryCount: 0,
        errorId: 'test-id',
      };
      
      expect(validateApiError(error)).toBe(false);
    });

    it('should reject empty code', () => {
      const error: ApiError = {
        status: 400,
        message: 'Test message',
        code: '',  // Empty
        isRetriable: false,
        retryCount: 0,
        errorId: 'test-id',
      };
      
      expect(validateApiError(error)).toBe(false);
    });

    it('should reject invalid isRetriable type', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error: any = {
        status: 400,
        message: 'Test',
        code: 'TEST',
        isRetriable: 'yes',  // Should be boolean
        retryCount: 0,
        errorId: 'test-id',
      };
      
      expect(validateApiError(error)).toBe(false);
    });

    it('should reject invalid retryCount (negative or too high)', () => {
      const error1: ApiError = {
        status: 400,
        message: 'Test',
        code: 'TEST',
        isRetriable: true,
        retryCount: -1,  // Invalid
        errorId: 'test-id',
      };
      
      const error2: ApiError = {
        status: 400,
        message: 'Test',
        code: 'TEST',
        isRetriable: true,
        retryCount: 4,  // Too high (max is 3)
        errorId: 'test-id',
      };
      
      expect(validateApiError(error1)).toBe(false);
      expect(validateApiError(error2)).toBe(false);
    });

    it('should reject invalid errorId', () => {
      const error: ApiError = {
        status: 400,
        message: 'Test',
        code: 'TEST',
        isRetriable: false,
        retryCount: 0,
        errorId: '',  // Empty
      };
      
      expect(validateApiError(error)).toBe(false);
    });

    it('should accept valid validationErrors object', () => {
      const error = createApiError(
        400,
        'VALIDATION_ERROR',
        'Invalid input',
        { email: 'Invalid email', password: 'Too short' },
        false,
        0
      );
      
      expect(validateApiError(error)).toBe(true);
    });

    it('should reject invalid validationErrors type', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error: any = {
        status: 400,
        message: 'Test',
        code: 'TEST',
        isRetriable: false,
        retryCount: 0,
        errorId: 'test-id',
        validationErrors: 'not an object',  // Should be object or undefined
      };
      
      expect(validateApiError(error)).toBe(false);
    });

    it('should accept all valid retryCount values (0-3)', () => {
      for (let i = 0; i <= 3; i++) {
        const error: ApiError = {
          status: 429,
          message: 'Test',
          code: 'TEST',
          isRetriable: true,
          retryCount: i,
          errorId: `test-id-${i}`,
        };
        
        expect(validateApiError(error)).toBe(true);
      }
    });

    it('should accept all valid HTTP status codes', () => {
      const validStatuses = [400, 401, 403, 404, 408, 429, 500, 502, 503];
      
      validStatuses.forEach(status => {
        const error: ApiError = {
          status,
          message: 'Test',
          code: 'TEST',
          isRetriable: false,
          retryCount: 0,
          errorId: 'test-id',
        };
        
        expect(validateApiError(error)).toBe(true);
      });
    });
  });
});
