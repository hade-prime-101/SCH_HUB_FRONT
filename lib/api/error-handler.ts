// lib/api/error-handler.ts

/**
 * Normalise any thrown value into an Error instance with a consistent message.
 */
export function normalizeError(err: unknown): Error {
  if (err instanceof Error) {
    return err;
  }
  if (typeof err === "string") {
    return new Error(err);
  }
  if (err && typeof err === "object") {
    const obj = err as Record<string, unknown>;
    const message = obj.message || obj.error || "An error occurred";
    return new Error(String(message));
  }
  return new Error("An unknown error occurred");
}

/**
 * Check if an error represents a 401 Unauthorized response.
 */
export function isUnauthorized(error: Error): boolean {
  // Some API clients put status on the error object.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maybeStatus = (error as any).status ?? (error as any).statusCode;
  if (typeof maybeStatus === "number" && maybeStatus === 401) {
    return true;
  }
  // Check message for common patterns.
  const msg = error.message.toLowerCase();
  return msg.includes("unauthorized") || msg.includes("401") || msg.includes("unauthenticated");
}
