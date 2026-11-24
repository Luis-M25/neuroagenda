'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError, apiClient } from '@/lib/api-client';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

interface UseApiOptions {
  immediate?: boolean;
  onError?: (error: ApiError) => void;
  onSuccess?: <T,>(data: T) => void;
}

/**
 * Custom hook para manejar llamadas a API con estado automático.
 * Reduce la duplicación de código que trae useState + useEffect + fetch.
 *
 * @example
 * // Fetch automático al montar
 * const { data, loading, error } = useApi(
 *   () => citasApi.getAll({ fechaInicio, fechaFin }),
 *   [fechaInicio, fechaFin]
 * );
 *
 * @example
 * // Fetch manual
 * const { data, loading, refetch } = useApi(
 *   () => citasApi.getById(id),
 *   [id],
 *   { immediate: false }
 * );
 *
 * // Trigger later
 * const handleRefresh = () => refetch();
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  dependencies: any[] = [],
  options: UseApiOptions = {},
): UseApiState<T> & { refetch: () => void } {
  const { immediate = true, onError, onSuccess } = options;
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const refetch = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const result = await fetcher();
      setState({ data: result, loading: false, error: null });
      onSuccess?.(result);
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError({ message: String(err) });
      setState({ data: null, loading: false, error: apiError });
      onError?.(apiError);
    }
  }, [fetcher, onError, onSuccess]);

  useEffect(() => {
    if (!immediate) return;
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- array de dependencias dinamico
  }, dependencies);

  return { ...state, refetch };
}
