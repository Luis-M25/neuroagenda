import { apiClient, setTokens, clearTokens, ApiError } from './client';

global.fetch = jest.fn();
const fetchMock = global.fetch as jest.Mock;

beforeEach(() => {
  fetchMock.mockReset();
  localStorage.clear();
  clearTokens();
});

afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

function okResponse(data: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => data,
    text: async () => JSON.stringify(data),
  };
}

function errorResponse(status: number, body = '{}') {
  return {
    ok: false,
    status,
    json: async () => JSON.parse(body),
    text: async () => body,
  };
}

describe('apiClient', () => {
  it('retorna el JSON parseado cuando la respuesta es 200', async () => {
    fetchMock.mockResolvedValue(okResponse({ mensaje: 'ok' }));

    const result = await apiClient('/ruta');
    expect(result).toEqual({ mensaje: 'ok' });
  });

  it('ante 401, dos llamadas concurrentes disparan UNA SOLA llamada de refresh', async () => {
    const callCounts: Record<string, number> = {};
    let refreshCalls = 0;

    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/auth/refresh')) {
        refreshCalls++;
        return Promise.resolve(okResponse({ accessToken: 'new-token' }));
      }

      callCounts[url] = (callCounts[url] || 0) + 1;
      if (callCounts[url] === 1) {
        return Promise.resolve(errorResponse(401));
      }
      return Promise.resolve(okResponse({ ok: true }));
    });

    setTokens('old-token');

    await Promise.all([
      apiClient('/ruta-a'),
      apiClient('/ruta-b'),
    ]);

    expect(refreshCalls).toBe(1);
  });

  it('ante 500, reintenta hasta agotar los reintentos y lanza ApiError', async () => {
    fetchMock.mockResolvedValue(errorResponse(500));

    await expect(apiClient('/ruta-500')).rejects.toThrow(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('does not retry POST on 500', async () => {
    fetchMock.mockResolvedValue(errorResponse(500));

    await expect(
      apiClient('/ruta-post', { method: 'POST' }),
    ).rejects.toThrow(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
