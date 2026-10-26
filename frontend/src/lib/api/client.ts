const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

let accessToken: string | null = null;

if (typeof window !== 'undefined') {
  accessToken = localStorage.getItem('accessToken');
}

export function setTokens(access: string) {
  accessToken = access;
  localStorage.setItem('accessToken', access);
}

export function clearTokens() {
  accessToken = null;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
}

export function getAccessToken() {
  return accessToken;
}

let inflightRefresh: Promise<boolean> | null = null;

export async function refreshSession(): Promise<boolean> {
  return refreshAccessToken();
}

async function refreshAccessToken(): Promise<boolean> {
  if (inflightRefresh) return inflightRefresh;
  inflightRefresh = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) return false;
      const data = await res.json();
      accessToken = data.accessToken;
      localStorage.setItem('accessToken', data.accessToken);
      return true;
    } catch {
      return false;
    } finally {
      inflightRefresh = null;
    }
  })();
  return inflightRefresh;
}

export class ApiError extends Error {
  data: any;
  constructor(data: any) {
    const isProduction = process.env.NODE_ENV === 'production';
    const isClientError = data.statusCode && data.statusCode >= 400 && data.statusCode < 500;
    const message = isProduction && !isClientError
      ? 'Error inesperado del servidor'
      : (data.message || `Error ${data.statusCode || 500}`);
    super(message);
    this.name = 'ApiError';
    this.data = data;
  }
}

const BACKOFF_DELAYS = [300, 800, 2000];
const RETRYABLE_STATUSES = new Set([500, 502, 503, 504]);
const RETRYABLE_5XX_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function stripAuthHeaders(incoming: Record<string, string>): Record<string, string> {
  const cleaned: Record<string, string> = {};
  for (const [key, val] of Object.entries(incoming)) {
    if (key.toLowerCase() !== 'authorization') {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0,
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

  const callerHeaders = stripAuthHeaders((options.headers as Record<string, string>) || {});
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...callerHeaders,
  };

  const token = accessToken || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(url, { ...options, headers, credentials: 'include' });

  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      res = await fetch(url, { ...options, headers, credentials: 'include' });
    } else {
      clearTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Sesion expirada');
    }
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ message: 'Error desconocido' }));

    if (
      RETRYABLE_STATUSES.has(res.status) &&
      RETRYABLE_5XX_METHODS.has((options.method || 'GET').toUpperCase()) &&
      retryCount < BACKOFF_DELAYS.length
    ) {
      await sleep(BACKOFF_DELAYS[retryCount]);
      const cleanOptions = { ...options, headers: callerHeaders };
      return apiClient<T>(endpoint, cleanOptions, retryCount + 1);
    }

    throw new ApiError({ ...errorBody, statusCode: res.status });
  }

  const text = await res.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
}
