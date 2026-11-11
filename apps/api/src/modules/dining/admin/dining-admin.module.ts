import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { DiningAdminController } from './dining-admin.controller';
import { DiningAdminService } from './dining-admin.service';

/** Stream D: dining administration (overview, venue settings, menu editor). */
@Module({
  imports: [AuditModule],
  controllers: [DiningAdminController],
  providers: [DiningAdminService],
})
export class DiningAdminModule {}
