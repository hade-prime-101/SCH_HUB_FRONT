// lib/hooks/usePaginatedQuery.ts

import { useState, useEffect, useCallback, useRef } from "react";
import { normalizeError, isUnauthorized } from "@/lib/api/error-handler";
import { extractData, extractTotal } from "@/lib/api/response-helpers";

type PaginatedOptions = {
  onUnauthorized?: () => void;
  skip?: boolean;
};

type PaginatedParams = {
  page: number;
  limit: number;
};

type PaginatedFetcher<T> = (params: PaginatedParams) => Promise<{
  data?: T[];
  total?: number;
} | T[]>;

/**
 * usePaginatedQuery
 *
 * A hook that manages paginated data fetching with built‑in page state.
 *
 * @example
 * ```ts
 * const { data, total, page, setPage, loading, error, refetch } = usePaginatedQuery(
 *   (params) => api.listItems(params),
 *   { page: 1, limit: 10 }
 * );
 * ```
 */
export function usePaginatedQuery<T>(
  fetcher: PaginatedFetcher<T>,
  initialParams: PaginatedParams,
  options: PaginatedOptions = {}
) {
  const { onUnauthorized, skip = false } = options;
  const [page, setPage] = useState(initialParams.page);
  const [limit] = useState(initialParams.limit);
  const [data, setData] = useState<T[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);

  const fetchData = useCallback(async () => {
    if (skip) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher({ page, limit });
      const items = extractData<T>(result);
      const totalCount = extractTotal(result);
      if (isMounted.current) {
        setData(items);
        setTotal(totalCount);
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
  }, [fetcher, page, limit, skip, onUnauthorized]);

  useEffect(() => {
    isMounted.current = true;
    fetchData();
    return () => {
      isMounted.current = false;
    };
     
  }, [fetchData]);

  const refetch = useCallback(() => fetchData(), [fetchData]);

  return { data, total, page, setPage, loading, error, refetch };
}