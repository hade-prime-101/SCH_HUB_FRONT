// lib/api/response-helpers.ts

/**
 * Safely extract the data array from an API response.
 * Handles both `{ data: T[] }` and raw `T[]` responses.
 */
export function extractData<T>(response: unknown): T[] {
  if (Array.isArray(response)) {
    return response as T[];
  }
  if (response && typeof response === "object") {
    const obj = response as Record<string, unknown>;
    if (Array.isArray(obj.data)) {
      return obj.data as T[];
    }
  }
  return [];
}

/**
 * Safely extract the total count from an API response.
 */
export function extractTotal(response: unknown): number {
  if (response && typeof response === "object") {
    const obj = response as Record<string, unknown>;
    if (typeof obj.total === "number") {
      return obj.total;
    }
  }
  return 0;
}

/**
 * Safely extract unread count from notification responses.
 */
export function extractUnreadCount(response: unknown): number {
  if (response && typeof response === "object") {
    const obj = response as Record<string, unknown>;
    if (typeof obj.unreadCount === "number") {
      return obj.unreadCount;
    }
  }
  return 0;
}