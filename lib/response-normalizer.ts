/**
 * Response Normalization Utility
 * 
 * Provides consistent response formatting across all API calls.
 * - Success responses: { success: true, data: <payload>, meta?: <metadata> }
 * - Error responses: { success: false, message: <message>, code: <code>, errors?: <field_errors> }
 */

export interface NormalizedSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface NormalizedErrorResponse {
  success: false;
  message: string;
  code: string;
  errors?: Record<string, string>;
}

export type NormalizedResponse<T> = NormalizedSuccessResponse<T> | NormalizedErrorResponse;

/**
 * Checks if a value looks like a validation error object
 * Validation errors typically have field names as keys and error messages as values
 */
function isValidationErrorObject(value: unknown): value is Record<string, string> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const obj = value as Record<string, unknown>;
  
  // Check if it has string values (indicating field error messages)
  for (const key in obj) {
    const val = obj[key];
    if (typeof val !== 'string') {
      return false;
    }
  }

  return true;
}

/**
 * Extracts field-level validation errors from a response object
 * Looks for common patterns like:
 * - errors: { fieldName: "message" }
 * - validationErrors: { fieldName: "message" }
 * - fieldErrors: { fieldName: "message" }
 * - Direct field mappings in response body
 */
function extractValidationErrors(
  response: Record<string, unknown>
): Record<string, string> | undefined {
  // Check for explicit errors object
  if (response.errors && isValidationErrorObject(response.errors)) {
    return response.errors;
  }

  // Check for validationErrors object
  if (
    response.validationErrors &&
    isValidationErrorObject(response.validationErrors)
  ) {
    return response.validationErrors;
  }

  // Check for fieldErrors object
  if (
    response.fieldErrors &&
    isValidationErrorObject(response.fieldErrors)
  ) {
    return response.fieldErrors;
  }

  return undefined;
}

/**
 * Extracts an error code from a response
 * Looks for common patterns: code, errorCode, type, errorType
 */
function extractErrorCode(response: Record<string, unknown>): string {
  if (typeof response.code === 'string') {
    return response.code;
  }

  if (typeof response.errorCode === 'string') {
    return response.errorCode;
  }

  if (typeof response.type === 'string') {
    return response.type;
  }

  if (typeof response.errorType === 'string') {
    return response.errorType;
  }

  // Default based on status code if available
  return 'UNKNOWN_ERROR';
}

/**
 * Extracts an error message from a response
 * Looks for common patterns: message, msg, error, errorMessage
 */
function extractErrorMessage(response: Record<string, unknown>): string {
  if (typeof response.message === 'string') {
    return response.message;
  }

  if (typeof response.msg === 'string') {
    return response.msg;
  }

  if (typeof response.error === 'string') {
    return response.error;
  }

  if (typeof response.errorMessage === 'string') {
    return response.errorMessage;
  }

  return 'An error occurred';
}

/**
 * Normalizes a successful API response to standard shape
 * 
 * @param response - The raw response from the API
 * @param data - The payload to include in normalized response
 * @param meta - Optional metadata to include
 * @returns Normalized success response
 */
export function normalizeSuccessResponse<T>(
  data: T,
  meta?: Record<string, unknown>
): NormalizedSuccessResponse<T> {
  return {
    success: true,
    data,
    ...(meta && { meta }),
  };
}

/**
 * Normalizes an error API response to standard shape
 * 
 * Handles different error response formats:
 * - Backend with explicit errors object
 * - Backend with validation errors
 * - Backend with single error message
 * - Fallback to generic error
 * 
 * @param response - The raw error response from the API (parsed JSON)
 * @param statusCode - The HTTP status code
 * @returns Normalized error response
 */
export function normalizeErrorResponse(
  response: unknown,
  statusCode: number = 500
): NormalizedErrorResponse {
  // Handle non-object responses
  if (typeof response !== 'object' || response === null) {
    return {
      success: false,
      message: 'An unexpected error occurred',
      code: `HTTP_${statusCode}`,
    };
  }

  const responseObj = response as Record<string, unknown>;

  // Extract error details from response
  const message = extractErrorMessage(responseObj);
  const code = extractErrorCode(responseObj);
  const validationErrors = extractValidationErrors(responseObj);

  const normalized: NormalizedErrorResponse = {
    success: false,
    message,
    code,
  };

  // Include validation errors if present
  if (validationErrors) {
    normalized.errors = validationErrors;
  }

  return normalized;
}

/**
 * Normalizes any API response (success or error) to standard shape
 * 
 * This is the main entry point for response normalization.
 * 
 * Usage:
 * ```typescript
 * const response = await fetch(url);
 * const json = await response.json();
 * const normalized = normalizeResponse(json, response.ok, response.status);
 * ```
 * 
 * @param response - The parsed JSON response from the API
 * @param isSuccess - Whether the response should be treated as successful
 * @param statusCode - The HTTP status code from the response
 * @param meta - Optional metadata to include in success response
 * @returns Normalized response (success or error)
 */
export function normalizeResponse<T = unknown>(
  response: unknown,
  isSuccess: boolean,
  statusCode: number = 200,
  meta?: Record<string, unknown>
): NormalizedResponse<T> {
  if (isSuccess) {
    // For successful responses, extract data or use entire response
    let data: T;

    if (typeof response === 'object' && response !== null) {
      const responseObj = response as Record<string, unknown>;
      
      // If response has a data field, use that
      if ('data' in responseObj && responseObj.data !== undefined) {
        data = responseObj.data as T;
      } else {
        data = response as T;
      }
    } else {
      data = response as T;
    }

    return normalizeSuccessResponse(data, meta);
  } else {
    return normalizeErrorResponse(response, statusCode);
  }
}

/**
 * Convenience wrapper for normalizing 400 (validation error) responses
 * 
 * @param response - The parsed JSON response with validation errors
 * @returns Normalized error response with field-level errors
 */
export function normalizeValidationError(
  response: unknown
): NormalizedErrorResponse {
  return normalizeErrorResponse(response, 400);
}
