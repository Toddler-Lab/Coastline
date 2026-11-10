import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { validateEnvironment } from './config/env.validation';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './common/auth/auth.module';
import { DemoAuthGuard } from './common/auth/demo-auth.guard';
import { RolesGuard } from './common/auth/roles.guard';
import { AuditModule } from './modules/audit/audit.module';
import { HealthModule } from './health/health.module';
import { IdentityModule } from './modules/identity/identity.module';
import { CatalogueModule } from './modules/catalogue/catalogue.module';
import { BookingsModule } from './modules/bookings/bookings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
      validate: validateEnvironment,
    }),
    PrismaModule,
    AuthModule,
    AuditModule,
    HealthModule,
    IdentityModule,
    CatalogueModule,
    BookingsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: DemoAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
