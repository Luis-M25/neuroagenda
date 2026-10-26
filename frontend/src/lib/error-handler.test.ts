import { ApiError } from '@/lib/api/client';
import {
  handleApiError,
  getValidationErrors,
  isRetryableError,
} from '@/lib/error-handler';

describe('Error Handler Utilities', () => {
  describe('handleApiError', () => {
    it('debe retornar mensaje de sesión expirada para 401', () => {
      const error = new ApiError({ statusCode: 401, message: 'Unauthorized' });
      const result = handleApiError(error);

      expect(result).toContain('sesión ha expirado');
    });

    it('debe retornar mensaje de permiso denegado para 403', () => {
      const error = new ApiError({ statusCode: 403, message: 'Forbidden' });
      const result = handleApiError(error);

      expect(result).toContain('permiso');
    });

    it('debe retornar mensaje de no encontrado para 404', () => {
      const error = new ApiError({ statusCode: 404, message: 'Not found' });
      const result = handleApiError(error);

      expect(result).toContain('No encontrado');
    });

    it('debe retornar mensaje de conflicto para 409', () => {
      const error = new ApiError({ statusCode: 409, message: 'Conflict' });
      const result = handleApiError(error);

      expect(result).toContain('Conflicto');
    });

    it('debe retornar mensaje de validación para 422', () => {
      const error = new ApiError({
        statusCode: 422,
        message: 'Validation failed',
      });
      const result = handleApiError(error);

      expect(result).toContain('Datos inválidos');
    });

    it('debe retornar fallback message si se proporciona', () => {
      const error = new ApiError({ statusCode: 500, message: 'Server error' });
      const result = handleApiError(error, { fallback: 'Custom error message' });

      expect(result).toBe('Custom error message');
    });

    it('debe incluir acción en el mensaje para errores no mapeados', () => {
      const error = new ApiError({ statusCode: 400, message: 'Bad request' });
      const result = handleApiError(error, { action: 'loading appointments' });

      expect(result).toContain('loading appointments');
    });

    it('debe manejar errores non-ApiError', () => {
      const error = new Error('Generic error');
      const result = handleApiError(error);

      expect(result).toContain('Generic error');
    });
  });

  describe('getValidationErrors', () => {
    it('debe extraer errores de validación como objeto', () => {
      const error = new ApiError({
        statusCode: 422,
        errors: {
          email: 'Email is required',
          password: 'Password must be at least 8 characters',
        },
      });

      const errors = getValidationErrors(error);

      expect(errors).toEqual({
        email: 'Email is required',
        password: 'Password must be at least 8 characters',
      });
    });

    it('debe extraer errores de array de validación', () => {
      const error = new ApiError({
        statusCode: 422,
        errors: [
          { field: 'email', message: 'Invalid format' },
          { field: 'password', message: 'Too short' },
        ],
      });

      const errors = getValidationErrors(error);

      expect(errors.email).toBe('Invalid format');
      expect(errors.password).toBe('Too short');
    });

    it('debe retornar objeto vacío si no es 422', () => {
      const error = new ApiError({ statusCode: 400, message: 'Bad request' });
      const errors = getValidationErrors(error);

      expect(errors).toEqual({});
    });

    it('debe retornar objeto vacío si no hay errors', () => {
      const error = new ApiError({ statusCode: 422, message: 'Error' });
      const errors = getValidationErrors(error);

      expect(errors).toEqual({});
    });
  });

  describe('isRetryableError', () => {
    it('debe retornar true para 408 Timeout', () => {
      const error = new ApiError({ statusCode: 408, message: 'Timeout' });
      expect(isRetryableError(error)).toBe(true);
    });

    it('debe retornar true para 429 Too Many Requests', () => {
      const error = new ApiError({ statusCode: 429, message: 'Rate limited' });
      expect(isRetryableError(error)).toBe(true);
    });

    it('debe retornar true para errores 5xx', () => {
      const error500 = new ApiError({ statusCode: 500, message: 'Server error' });
      const error502 = new ApiError({ statusCode: 502, message: 'Gateway error' });
      const error503 = new ApiError({ statusCode: 503, message: 'Service unavailable' });

      expect(isRetryableError(error500)).toBe(true);
      expect(isRetryableError(error502)).toBe(true);
      expect(isRetryableError(error503)).toBe(true);
    });

    it('debe retornar false para errores 4xx no retryables', () => {
      const error400 = new ApiError({ statusCode: 400, message: 'Bad request' });
      const error401 = new ApiError({ statusCode: 401, message: 'Unauthorized' });
      const error403 = new ApiError({ statusCode: 403, message: 'Forbidden' });
      const error404 = new ApiError({ statusCode: 404, message: 'Not found' });

      expect(isRetryableError(error400)).toBe(false);
      expect(isRetryableError(error401)).toBe(false);
      expect(isRetryableError(error403)).toBe(false);
      expect(isRetryableError(error404)).toBe(false);
    });
  });
});
