import { Module } from '@nestjs/common';
import { BookingsModule } from '../../bookings/bookings.module';
import { AdminReservationsController } from './admin-reservations.controller';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';

/** Stream B: table reservations. Reuses the exported sunbed `TicketService` to sign QR tickets. */
@Module({
  imports: [BookingsModule],
  controllers: [ReservationsController, AdminReservationsController],
  providers: [ReservationsService],
})
export class DiningReservationsModule {}
