// lib/hooks/useMutation.ts

import { useState, useCallback } from "react";
import { normalizeError } from "@/lib/api/error-handler";

type MutationState<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
};

export function useMutation<T, V = void>(
  mutationFn: (variables: V) => Promise<T>
) {
  const [state, setState] = useState<MutationState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(
    async (variables: V) => {
      setState({ data: null, loading: true, error: null });
      try {
        const result = await mutationFn(variables);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err) {
        const normalized = normalizeError(err);
        setState({ data: null, loading: false, error: normalized });
        throw normalized;
      }
    },
    [mutationFn]
  );

  return { ...state, mutate };
}