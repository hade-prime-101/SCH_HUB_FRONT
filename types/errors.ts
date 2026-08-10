/**
 * Error Types for API Client Completion
 * Defines error structures for context management and error handling
 */

/**
 * Core API error type representing a classified error response
 * Contains all information needed for error handling and retry logic
 */
export interface ApiError {
  /** HTTP status code from the error response */
  status: number;
  
  /** User-friendly error message for display */
  message: string;
  
  /** Machine-readable error code for programmatic handling */
  code: string;
  
  /** Field-level validation errors (only for 400 Bad Request) */
  validationErrors?: Record<string, string>;
  
  /** Whether this error can be retried */
  isRetriable: boolean;
  
  /** Current retry attempt count (0-3) */
  retryCount: number;
  
  /** Maximum allowed retry attempts */
  maxRetries: number;
  
  /** Unique identifier for tracking and managing this error */
  errorId: string;
  
  /** Original error object for debugging (not exposed in UI) */
  rawError?: unknown;
}

/**
 * Error notification for context management
 * Extends ApiError with tracking capability through unique ID
 * Used in Error Context for maintaining error state
 */
export interface ErrorNotification extends ApiError {
  /** Unique ID for this notification (used by Error Context) */
  id: string;
}

/**
 * Type guard to check if an object is a valid ApiError
 * @param error - Object to check
 * @returns true if object matches ApiError interface
 */
export function isApiError(error: unknown): error is ApiError {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const err = error as Record<string, unknown>;

  // Check required fields
  if (
    typeof err.status !== 'number' ||
    typeof err.message !== 'string' ||
    typeof err.code !== 'string' ||
    typeof err.isRetriable !== 'boolean' ||
    typeof err.retryCount !== 'number' ||
    typeof err.maxRetries !== 'number' ||
    typeof err.errorId !== 'string'
  ) {
    return false;
  }

  // Check optional validationErrors field if present
  if (
    err.validationErrors !== undefined &&
    (typeof err.validationErrors !== 'object' ||
      err.validationErrors === null ||
      Array.isArray(err.validationErrors))
  ) {
    return false;
  }

  return true;
}

/**
 * Type guard to check if an object is a valid ErrorNotification
 * @param error - Object to check
 * @returns true if object matches ErrorNotification interface
 */
export function isErrorNotification(error: unknown): error is ErrorNotification {
  if (!isApiError(error)) {
    return false;
  }

  const notification = error as unknown as Record<string, unknown>;

  // Check that ErrorNotification has id field
  return typeof notification.id === 'string';
}

/**
 * Type guard to check if error is retriable
 * Useful for determining if retry logic should be attempted
 * @param error - ApiError to check
 * @returns true if error can be retried and retries remain
 */
export function canRetry(error: ApiError): boolean {
  return error.isRetriable && error.retryCount < error.maxRetries;
}

/**
 * Type guard to check if error contains validation errors
 * Useful for determining how to display error to user
 * @param error - ApiError to check
 * @returns true if error has field-level validation errors
 */
export function hasValidationErrors(error: ApiError): boolean {
  return (
    error.validationErrors !== undefined &&
    Object.keys(error.validationErrors).length > 0
  );
}

/**
 * HTTP status codes that indicate the error can be retried
 */
export const RETRIABLE_STATUS_CODES = new Set([
  401, // Unauthorized (can retry with token refresh)
  408, // Request Timeout
  429, // Too Many Requests (rate limit)
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
]);

/**
 * Error codes for common error scenarios
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  TIMEOUT: 'TIMEOUT',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

/**
 * Default values for error fields
 */
export const ERROR_DEFAULTS = {
  MAX_RETRIES: 3,
  INITIAL_RETRY_COUNT: 0,
} as const;
