// lib/hooks/useQuery.ts

import { useState, useEffect, useCallback, useRef } from "react";
import { normalizeError, isUnauthorized } from "@/lib/api/error-handler";

type UseQueryOptions<T> = {
  /** Called when a 401 is detected – can redirect or clear auth */
  onUnauthorized?: () => void;
  /** Whether to skip the initial fetch */
  skip?: boolean;
};

/**
 * useQuery
 *
 * A lightweight data-fetching hook that handles loading, error, and refetch.
 * Automatically re-fetches when dependencies change.
 *
 * @example
 * ```ts
 * const { data, loading, error, refetch } = useQuery(
 *   () => api.getUser(),
 *   [userId]
 * );
 * ```
 */
export function useQuery<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList = [],
  options: UseQueryOptions<T> = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);
  const { onUnauthorized, skip = false } = options;

  const fetchData = useCallback(async () => {
    if (skip) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (isMounted.current) {
        setData(result);
        setLoading(false);
      }
    } catch (err) {
      const normalized = normalizeError(err);
      if (isUnauthorized(normalized) && onUnauthorized) {
        onUnauthorized();
      }
      if (isMounted.current) {
        setError(normalized);
        setLoading(false);
      }
    }
  }, [fetcher, skip, onUnauthorized]);

  useEffect(() => {
    isMounted.current = true;
    fetchData();
    return () => {
      isMounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, fetchData]);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}