import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { CatalogueModule } from '../catalogue/catalogue.module';
import { AdminOrdersController } from './admin-orders.controller';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { TicketService } from './ticket.service';

@Module({
  imports: [AuditModule, CatalogueModule],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersService, TicketService],
  exports: [OrdersService, TicketService],
})
export class BookingsModule {}
