import { ApiError, createApiError } from './error-types';

/**
 * Error codes mapping HTTP status codes to machine-readable codes
 */
const ERROR_CODE_MAP: Record<number, string> = {
  400: 'VALIDATION_ERROR',
  401: 'AUTHENTICATION_ERROR',
  403: 'AUTHORIZATION_ERROR',
  404: 'NOT_FOUND',
  408: 'TIMEOUT_ERROR',
  409: 'CONFLICT',
  429: 'RATE_LIMIT_ERROR',
  500: 'SERVER_ERROR',
  502: 'BAD_GATEWAY',
  503: 'SERVICE_UNAVAILABLE',
  504: 'GATEWAY_TIMEOUT',
};

/**
 * User-friendly error messages for common HTTP status codes
 */
const USER_MESSAGE_MAP: Record<number, string> = {
  400: 'Please check your input and try again.',
  401: 'Your session has expired. Please log in again.',
  403: 'You do not have permission to access this resource.',
  404: 'The requested resource was not found.',
  408: 'The request took too long. Please try again.',
  409: 'This resource already exists or has been modified. Please refresh and try again.',
  429: 'Too many requests. Please wait a moment before trying again.',
  500: 'An error occurred on the server. Please try again later.',
  502: 'Service temporarily unavailable. Please try again later.',
  503: 'Service temporarily unavailable. Please try again later.',
  504: 'Service temporarily unavailable. Please try again later.',
};

/**
 * ErrorHandler utility class for classifying and formatting HTTP errors
 */
export class ErrorHandler {
  /**
   * Classify an HTTP response as an ApiError
   * @param response - The Response object from fetch
   * @param body - Optional parsed response body
   * @returns ApiError with classification and metadata
   */
  static classifyError(response: Response, body?: unknown): ApiError {
    const status = response.status;
    const code = ERROR_CODE_MAP[status] || 'UNKNOWN_ERROR';
    const message = ErrorHandler.getUserFriendlyMessage(status, body);
    const isRetriable = ErrorHandler.isRetriable(status);
    
    let validationErrors: Record<string, string> | undefined;
    
    // Extract field-level validation errors for 400 responses
    if (status === 400) {
      validationErrors = ErrorHandler.extractValidationErrors(body);
    }
    
    return createApiError(status, code, message, validationErrors, isRetriable, 0);
  }

  /**
   * Determine if an error should be retried based on status code
   * @param status - HTTP status code
   * @returns true if error is retriable, false otherwise
   */
  static isRetriable(status: number): boolean {
    // 401 is retriable via token refresh (handled separately)
    // 408 is retriable with backoff
    // 429 is retriable with backoff
    // 5xx is retriable with backoff
    return status === 401 || status === 408 || status === 429 || (status >= 500 && status < 600);
  }

  /**
   * Calculate exponential backoff delay in milliseconds
   * @param retryCount - Current retry attempt (0-indexed)
   * @returns Delay in milliseconds (2s, 4s, 8s, 16s, 32s max)
   */
  static getBackoffDelay(retryCount: number): number {
    const delays = [2000, 4000, 8000, 16000, 32000];
    return delays[Math.min(Math.max(retryCount, 0), 4)];
  }

  /**
   * Format error for UI consumption
   * @param error - The ApiError to format
   * @returns User-friendly error message or object
   */
  static formatErrorForUI(error: ApiError): string {
    // For validation errors with field-specific details
    if (error.status === 400 && error.validationErrors && Object.keys(error.validationErrors).length > 0) {
      const fieldMessages = Object.entries(error.validationErrors)
        .map(([field, message]) => `${ErrorHandler.formatFieldName(field)}: ${message}`)
        .join('\n');
      return fieldMessages;
    }
    
    // Otherwise return the general message
    return error.message;
  }

  /**
   * Format a field name to be more user-friendly
   * Converts camelCase or snake_case to Title Case
   */
  private static formatFieldName(field: string): string {
    // Convert camelCase to space-separated words
    const withSpaces = field
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ');
    
    // Capitalize first letter of each word
    return withSpaces
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Format error for logging/debugging
   * @param error - The ApiError to format
   * @returns Formatted string suitable for console or error tracking
   */
  static formatErrorForLogging(error: ApiError): string {
    const lines: string[] = [];
    
    lines.push(`ApiError [${error.status}] (${error.code}): ${error.message}`);
    
    if (error.validationErrors && Object.keys(error.validationErrors).length > 0) {
      lines.push('Field-level errors:');
      for (const [field, fieldError] of Object.entries(error.validationErrors)) {
        lines.push(`  - ${field}: ${fieldError}`);
      }
    }
    
    if (error.retryCount > 0) {
      lines.push(`Retry count: ${error.retryCount}`);
    }
    
    return lines.join('\n');
  }

  /**
   * Determines if an error should be retried (retriable and has retries remaining)
   */
  static shouldRetry(error: ApiError): boolean {
    return error.isRetriable && error.retryCount < 3;
  }

  /**
   * Extract field-level validation errors from a response body
   */
  private static extractValidationErrors(body: unknown): Record<string, string> | undefined {
    if (!body || typeof body !== 'object') {
      return undefined;
    }

    const errors: Record<string, string> = {};
    const bodyObj = body as Record<string, unknown>;

    // Try to extract from 'errors' field
    if (bodyObj.errors && typeof bodyObj.errors === 'object') {
      const errorObj = bodyObj.errors as Record<string, unknown>;
      for (const [key, value] of Object.entries(errorObj)) {
        if (typeof value === 'string') {
          errors[key] = value;
        } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
          errors[key] = value[0];
        }
      }
    }

    // Try to extract from 'fieldErrors' field
    if (Object.keys(errors).length === 0 && bodyObj.fieldErrors && typeof bodyObj.fieldErrors === 'object') {
      const errorObj = bodyObj.fieldErrors as Record<string, unknown>;
      for (const [key, value] of Object.entries(errorObj)) {
        if (typeof value === 'string') {
          errors[key] = value;
        } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
          errors[key] = value[0];
        }
      }
    }

    return Object.keys(errors).length > 0 ? errors : undefined;
  }

  /**
   * Get user-friendly error message based on status code and response data
   * @param status - HTTP status code
   * @param data - Response data
   * @returns User-friendly error message
   */
  private static getUserFriendlyMessage(status: number, data: unknown): string {
    // If response contains a custom message, use it
    if (data && typeof data === 'object') {
      const obj = data as Record<string, any>;
      if (obj.message && typeof obj.message === 'string') {
        return obj.message;
      }
    }
    
    // Fall back to default message for status code
    return USER_MESSAGE_MAP[status] || 'An unexpected error occurred. Please try again.';
  }
}

export default ErrorHandler;
