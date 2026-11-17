import { Module } from '@nestjs/common';
import { BookingsModule } from '../bookings/bookings.module';
import { DiningAdminModule } from '../dining/admin/dining-admin.module';
import { DiningDeliveryModule } from '../dining/delivery/dining-delivery.module';
import { DiningReservationsModule } from '../dining/reservations/dining-reservations.module';
import { DeskController } from './desk.controller';
import { ProviderController } from './provider.controller';
import { WorkspaceScopeService } from './workspace-scope.service';

/** Provider portal and spot desk APIs, scoped by membership and desk assignment (WP-04). */
@Module({
  imports: [BookingsModule, DiningAdminModule, DiningDeliveryModule, DiningReservationsModule],
  controllers: [ProviderController, DeskController],
  providers: [WorkspaceScopeService],
  exports: [WorkspaceScopeService],
})
export class WorkspacesModule {}
