import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded, raw } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import { AppModule } from './app.module';
import { validateRequiredEnv } from './common/env.validation';
import { SanitizePipe } from './common/pipes/sanitize.pipe';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { winstonLogger } from './common/winston.logger';

async function bootstrap() {
  validateRequiredEnv();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
    logger: WinstonModule.createLogger({ instance: winstonLogger }),
  });

  const logger = new Logger('Bootstrap');

  app.use(compression());

  app.use(cookieParser());
  app.use(helmet());

  app.use('/api/v1/whatsapp/webhook', raw({ type: 'application/json' }));
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));

  if (process.env.NODE_ENV === 'production') {
    app.enable('trust proxy');
    app.use((_req: any, res: any, next: any) => {
      if (!_req.secure) {
        const host = _req.get('host') || 'localhost';
        return res.redirect(301, `https://${host}${_req.url}`);
      }
      next();
    });
  }

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new SanitizePipe(),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      // Mensajes legibles: AllExceptionsFilter solo propaga `message` si es string.
      // Sin esto, el frontend recibe el genérico "Bad Request Exception".
      exceptionFactory: (errors) => {
        const messages = errors.flatMap((e) =>
          e.constraints ? Object.values(e.constraints) : [`${e.property} inválido`],
        );
        return new BadRequestException(messages.join('; ') || 'Datos inválidos');
      },
    }),
  );

  app.setGlobalPrefix('api/v1');
  const frontendOrigin = process.env.FRONTEND_URL || '';
  const socketOrigin = process.env.SOCKET_CORS_ORIGIN || frontendOrigin;
  const origins = [frontendOrigin, socketOrigin].filter(Boolean);

  if (origins.length === 0) {
    logger.warn(
      'No se configuraron origenes CORS. ' +
      'Configura FRONTEND_URL o SOCKET_CORS_ORIGIN en las variables de entorno.',
    );
  }

  app.enableCors({
    origin: origins.length > 0 ? origins : false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
    credentials: true,
    maxAge: 86400,
  });

  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Agendamiento Medico API')
      .setDescription('API del Sistema de Agendamiento de Citas Medicas - Instituto de Neurociencias')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Backend running on http://localhost:${port}`);
  logger.log(`Swagger docs at http://localhost:${port}/api/docs`);
}
bootstrap();
