'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Async operation state interface
 */
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * useAsync Hook
 *
 * Manages async operation state with proper cleanup to prevent memory leaks.
 * Supports both immediate execution on mount and manual execution via execute().
 * Handles race conditions with cleanup and tracks component mount status.
 *
 * @template T - The type of data returned by the async function
 * @param asyncFunction - Function that returns a Promise
 * @param immediate - Whether to execute immediately on mount (default: true)
 * @returns {Object} Async state and execute method
 *   - data: Resolved data or null
 *   - loading: Loading state during async operation
 *   - error: Error if operation failed
 *   - execute: Function to manually trigger the async operation
 *
 * @example
 * ```typescript
 * const { data: schools, loading, error } = useAsync(
 *   () => apiClient.getSchools(),
 *   true
 * );
 *
 * if (loading) return <LoadingSkeleton />;
 * if (error) return <ErrorMessage message={error.message} />;
 * return <SelectionList items={schools} />;
 * ```
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate: boolean = true
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: () => Promise<T>;
} {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  // Use ref to track if component is mounted to prevent memory leaks
  const isMountedRef = useRef(true);

  // Use ref to track the current execution to prevent race conditions
  const executionCounterRef = useRef(0);

  /**
   * Execute the async function and update state
   */
  const execute = useCallback(async (): Promise<T> => {
    // Increment execution counter to detect race conditions
    const currentExecution = ++executionCounterRef.current;

    // Update state to loading
    if (isMountedRef.current) {
      setState({
        data: null,
        loading: true,
        error: null,
      });
    }

    try {
      // Execute the async function
      const result = await asyncFunction();

      // Only update state if:
      // 1. Component is still mounted
      // 2. This is the most recent execution (prevents race conditions)
      if (isMountedRef.current && currentExecution === executionCounterRef.current) {
        setState({
          data: result,
          loading: false,
          error: null,
        });
      }

      return result;
    } catch (err) {
      // Convert to Error if not already
      const error = err instanceof Error ? err : new Error(String(err));

      // Only update state if:
      // 1. Component is still mounted
      // 2. This is the most recent execution (prevents race conditions)
      if (isMountedRef.current && currentExecution === executionCounterRef.current) {
        setState({
          data: null,
          loading: false,
          error,
        });
      }

      throw error;
    }
  }, [asyncFunction]);

  /**
   * Execute immediately on mount if requested
   */
  useEffect(() => {
    if (immediate) {
      execute().catch((err) => {
        // Error is already handled in state, just log for debugging
        console.debug('useAsync initial execution failed:', err);
      });
    }

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
    };
  }, [immediate, execute]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    execute,
  };
}
