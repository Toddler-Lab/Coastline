import { Module } from '@nestjs/common';
import { DiningAdminModule } from './admin/dining-admin.module';
import { DiningCatalogueModule } from './catalogue/dining-catalogue.module';
import { DiningDeliveryModule } from './delivery/dining-delivery.module';
import { DiningReservationsModule } from './reservations/dining-reservations.module';

/**
 * Dining feature root. Each sub-module is owned by one stream so parallel work
 * does not touch the same files; only this file and AppModule wire them up.
 */
@Module({
  imports: [
    DiningCatalogueModule,
    DiningReservationsModule,
    DiningDeliveryModule,
    DiningAdminModule,
  ],
})
export class DiningModule {}
