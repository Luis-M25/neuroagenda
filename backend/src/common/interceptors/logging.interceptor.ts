import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

/**
 * Interceptor que registra información de todas las requests/responses
 * Útil para debugging, auditoría y monitoreo de performance
 *
 * Usa winston.logger si está configurado, sino usa el Logger nativo
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url } = request;
    const ip = request.ip || request.headers?.['x-forwarded-for'] || 'unknown';
    const userAgent = request.headers['user-agent'];

    request.auditContext = { ip, userAgent };

    // Información del usuario (si está autenticado)
    const userId = request.user?.id || 'anonymous';
    const startTime = Date.now();

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        // Log de request exitoso
        this.logger.log(
          `[${statusCode}] ${method} ${url} - ${duration}ms - User: ${userId} - IP: ${ip}`,
          'HTTP:SUCCESS',
        );

        // Log de requests lentas (> 1000ms)
        if (duration > 1000) {
          this.logger.warn(
            `SLOW REQUEST: ${method} ${url} took ${duration}ms`,
            'HTTP:PERFORMANCE',
          );
        }
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = error.status || 500;

        this.logger.error(
          `[${statusCode}] ${method} ${url} - ${duration}ms - User: ${userId} - Error: ${error.message}`,
          error.stack,
          'HTTP:ERROR',
        );

        throw error;
      }),
    );
  }
}
