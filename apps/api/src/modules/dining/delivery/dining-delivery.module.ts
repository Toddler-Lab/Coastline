import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { PaymentsModule } from '../../payments/payments.module';
import { AdminFoodOrdersController } from './admin-food-orders.controller';
import { FoodOrdersController } from './food-orders.controller';
import { FoodOrdersService } from './food-orders.service';

/** Stream C: sunbed food delivery (tourist ordering + ADMIN kitchen board). */
@Module({
  imports: [AuditModule, PaymentsModule],
  controllers: [FoodOrdersController, AdminFoodOrdersController],
  providers: [FoodOrdersService],
  exports: [FoodOrdersService],
})
export class DiningDeliveryModule {}
