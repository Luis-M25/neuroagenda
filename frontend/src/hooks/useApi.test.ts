import { renderHook, waitFor } from '@testing-library/react';
import { useApi } from '@/hooks/useApi';

// Mock de apiClient
jest.mock('@/lib/api/client', () => ({
  ApiError: class MockApiError extends Error {
    data = { message: 'Test error' };
  },
}));

describe('useApi Hook', () => {
  it('debe inicializar con estado de carga', () => {
    const mockFetcher = jest.fn().mockResolvedValue({ data: 'test' });
    const { result } = renderHook(() => useApi(mockFetcher, []));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('debe cargar datos exitosamente', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockFetcher = jest.fn().mockResolvedValue(mockData);

    const { result } = renderHook(() => useApi(mockFetcher, []));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBe(null);
    expect(mockFetcher).toHaveBeenCalledTimes(1);
  });

  it('debe manejar errores correctamente', async () => {
    const mockError = new Error('Test error');
    const mockFetcher = jest.fn().mockRejectedValue(mockError);

    const { result } = renderHook(() => useApi(mockFetcher, []));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.data).toBe(null);
  });

  it('debe permitir fetch manual con immediate: false', async () => {
    const mockFetcher = jest.fn().mockResolvedValue({ data: 'test' });

    const { result } = renderHook(() =>
      useApi(mockFetcher, [], { immediate: false }),
    );

    // No debe fetchear automáticamente
    expect(mockFetcher).not.toHaveBeenCalled();
    expect(result.current.data).toBe(null);

    // Fetch manual
    result.current.refetch();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFetcher).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual({ data: 'test' });
  });

  it('debe refetchear cuando las dependencias cambian', async () => {
    const mockFetcher = jest.fn().mockResolvedValue({ data: 'test' });
    const { rerender } = renderHook(
      ({ deps }: { deps: any[] }) => useApi(mockFetcher, deps),
      {
        initialProps: { deps: ['dep1'] },
      },
    );

    await waitFor(() => {
      expect(mockFetcher).toHaveBeenCalledTimes(1);
    });

    // Cambiar dependencia
    rerender({ deps: ['dep2'] });

    await waitFor(() => {
      expect(mockFetcher).toHaveBeenCalledTimes(2);
    });
  });

  it('debe llamar onSuccess cuando la data se carga', async () => {
    const mockData = { id: 1 };
    const mockFetcher = jest.fn().mockResolvedValue(mockData);
    const onSuccess = jest.fn();

    renderHook(() =>
      useApi(mockFetcher, [], { onSuccess }),
    );

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockData);
    });
  });

  it('debe llamar onError cuando hay un error', async () => {
    const mockError = new Error('Test error');
    const mockFetcher = jest.fn().mockRejectedValue(mockError);
    const onError = jest.fn();

    renderHook(() =>
      useApi(mockFetcher, [], { onError }),
    );

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
  });
});
