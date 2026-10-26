import { ApiError } from '@/lib/api/client';

export interface ErrorContext {
  action?: string; // e.g., "loading appointments"
  fallback?: string;
}

/**
 * Maneja errores de API de forma centralizada.
 * Detecta tipos de error y ejecuta acciones apropiadas.
 *
 * @example
 * try {
 *   await citasApi.create(data);
 * } catch (err) {
 *   handleApiError(err, { action: 'creating appointment' });
 * }
 */
export function handleApiError(error: unknown, context: ErrorContext = {}): string {
  const { action = 'performing action', fallback } = context;

  // Si no es ApiError, convertir a mensaje genérico
  if (!(error instanceof ApiError)) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const fullMessage = `Error ${action}: ${message}`;
    console.error(fullMessage, error);
    return fallback || fullMessage;
  }

  const apiError = error as ApiError;
  const statusCode = apiError.data?.statusCode;
  const message = apiError.data?.message || apiError.message;

  // Manejo específico por status code
  switch (statusCode) {
    case 401:
      // Token expirado o inválido - manejado en api-client
      return 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.';

    case 403:
      // Forbidden - no tiene permisos
      return 'No tienes permiso para realizar esta acción.';

    case 404:
      // Not found
      return `No encontrado: ${message || 'el recurso solicitado'}`;

    case 409:
      // Conflict (e.g., duplicate)
      return `Conflicto: ${message || 'el recurso ya existe'}`;

    case 422:
      // Validation error
      return `Datos inválidos: ${message || 'verifica los campos'}`;

    case 500:
    case 502:
    case 503:
    case 504:
      // Server error
      console.error(`Server error ${statusCode}:`, apiError);
      return fallback || 'Error del servidor. Por favor intenta más tarde.';

    default:
      console.error(`API Error ${statusCode}:`, apiError);
      return fallback || `Error al ${action}: ${message}`;
  }
}

/**
 * Extrae mensajes de validación de errores 422.
 * @example
 * const errors = getValidationErrors(apiError);
 * // { email: "Email already in use", password: "Too short" }
 */
export function getValidationErrors(
  error: ApiError,
): Record<string, string> {
  if (error.data?.statusCode !== 422) return {};

  const errors = error.data?.errors || error.data?.message;
  if (!errors) return {};

  // Si es un objeto directo
  if (typeof errors === 'object' && !Array.isArray(errors)) {
    return errors as Record<string, string>;
  }

  // Si es un array de errores
  if (Array.isArray(errors)) {
    return errors.reduce(
      (acc, err) => {
        const field = err.property || err.field || 'form';
        acc[field] = err.message || err.constraint;
        return acc;
      },
      {} as Record<string, string>,
    );
  }

  return {};
}

/**
 * Verifica si un error es recuperable (retry tiene sentido).
 * @example
 * if (isRetryableError(error)) {
 *   await retryWithBackoff(() => citasApi.getAll());
 * }
 */
export function isRetryableError(error: ApiError): boolean {
  const statusCode = error.data?.statusCode;
  // Errores de servidor, timeout, etc.
  return statusCode === 408 || statusCode === 429 || statusCode >= 500;
}

/**
 * Retry con backoff exponencial
 * @example
 * await retryWithBackoff(() => apiCall(), { maxRetries: 3 })
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; initialDelayMs?: number } = {},
): Promise<T> {
  const { maxRetries = 3, initialDelayMs = 1000 } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isRetryable = error instanceof ApiError && isRetryableError(error);
      const isLastAttempt = attempt === maxRetries;

      if (!isRetryable || isLastAttempt) {
        throw error;
      }

      // Backoff exponencial con jitter
      const delayMs = initialDelayMs * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error('Retry exhausted');
}
