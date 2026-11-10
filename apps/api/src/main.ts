import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { configureApplication } from './app.setup';

function parseOrigins(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          upgradeInsecureRequests: null,
        },
      },
    }),
  );

  const allowedOrigins = parseOrigins(
    config.get<string>('CORS_ORIGINS') ?? config.get<string>('WEB_ORIGIN'),
  );
  app.enableCors({ origin: allowedOrigins, credentials: true });

  configureApplication(app);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Coastline API')
    .setDescription(
      [
        'Sunbed catalogue, hourly availability, mock-paid bookings and QR tickets.',
        'Demo data only. Payments are simulated and no money is collected.',
      ].join('\n\n'),
    )
    .setVersion('0.1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, { jsonDocumentUrl: 'api/docs-json' });

  app.enableShutdownHooks();

  const port = config.get<number>('PORT', 3001);
  await app.listen(port);
  logger.log(`API listening on http://127.0.0.1:${port}`);
  logger.log(`Swagger UI at http://127.0.0.1:${port}/api/docs`);
}

void bootstrap();
