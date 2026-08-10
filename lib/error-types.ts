import { v4 as uuidv4 } from 'uuid';

/**
 * Represents a standardized API error with classification and retry information
 */
export interface ApiError {
  status: number;                          // HTTP status code
  message: string;                         // User-friendly error message
  code: string;                            // Machine-readable error code
  validationErrors?: Record<string, string>; // Field-level validation errors
  isRetriable: boolean;                    // Can this error be retried?
  retryCount: number;                      // Current retry attempt (0-3)
  errorId: string;                         // Unique ID for tracking
}

/**
 * Create a new ApiError instance with a unique error ID
 */
export function createApiError(
  status: number,
  code: string,
  message: string,
  validationErrors?: Record<string, string>,
  isRetriable?: boolean,
  retryCount?: number
): ApiError {
  return {
    status,
    code,
    message,
    validationErrors,
    isRetriable: isRetriable ?? false,
    retryCount: retryCount ?? 0,
    errorId: uuidv4(),
  };
}

/**
 * Validate that an object conforms to the ApiError interface
 */
export function validateApiError(value: unknown): value is ApiError {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const error = value as Record<string, unknown>;

  // Check required fields
  if (
    typeof error.status !== 'number' ||
    typeof error.message !== 'string' ||
    typeof error.code !== 'string' ||
    typeof error.isRetriable !== 'boolean' ||
    typeof error.retryCount !== 'number' ||
    typeof error.errorId !== 'string'
  ) {
    return false;
  }

  // Validate status code is valid HTTP status
  if (error.status < 100 || error.status > 599) {
    return false;
  }

  // Validate message is not empty
  if (error.message.length === 0) {
    return false;
  }

  // Validate code is not empty
  if (error.code.length === 0) {
    return false;
  }

  // Validate errorId is not empty
  if (error.errorId.length === 0) {
    return false;
  }

  // Validate retryCount is in valid range (0-3)
  if (error.retryCount < 0 || error.retryCount > 3) {
    return false;
  }

  // Validate validationErrors if present
  if (error.validationErrors !== undefined) {
    if (typeof error.validationErrors !== 'object' || error.validationErrors === null) {
      return false;
    }
    if (Array.isArray(error.validationErrors)) {
      return false;
    }
  }

  return true;
}
