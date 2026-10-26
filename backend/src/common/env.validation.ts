import { Logger } from '@nestjs/common';

const logger = new Logger('EnvValidation');

const REQUIRED_ENV = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];

const WARN_MISSING = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'WHATSAPP_ACCESS_TOKEN',
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_VERIFY_TOKEN',
  'FRONTEND_URL',
  'DATABASE_URL',
];

export function validateRequiredEnv(): void {
  const missing: string[] = [];

  for (const key of REQUIRED_ENV) {
    if (!process.env[key]) {
      missing.push(key);
      logger.error(`Falta variable de entorno requerida: ${key}`);
    }
  }

  for (const key of WARN_MISSING) {
    if (!process.env[key]) {
      logger.warn(`Variable de entorno opcional no configurada: ${key}`);
    }
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    logger.warn('JWT_SECRET es muy corto. Se recomienda al menos 32 caracteres.');
  }

  if (missing.length > 0) {
    throw new Error(
      `Variables de entorno requeridas faltantes: ${missing.join(', ')}. ` +
      'Configuralas en el archivo .env antes de iniciar la aplicacion.',
    );
  }

  logger.log('Variables de entorno validadas correctamente');
}
