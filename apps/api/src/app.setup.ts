import { RequestMethod, ValidationPipe, type INestApplication } from '@nestjs/common';
import { AllExceptionsFilter } from './common/errors/all-exceptions.filter';
import { requestIdMiddleware } from './common/http/request-id.middleware';

/** HTTP configuration shared by bootstrap and API tests. */
export function configureApplication(app: INestApplication): void {
  app.use(requestIdMiddleware);

  app.setGlobalPrefix('api/v1', {
    exclude: [
      { path: 'health/live', method: RequestMethod.GET },
      { path: 'health/ready', method: RequestMethod.GET },
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
}
