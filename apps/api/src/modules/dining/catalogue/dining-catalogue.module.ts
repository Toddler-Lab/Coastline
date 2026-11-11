import { Module } from '@nestjs/common';
import { DiningCatalogueController } from './dining-catalogue.controller';
import { DiningCatalogueService } from './dining-catalogue.service';

/**
 * Stream A: public venue and menu catalogue. Exports `DiningCatalogueService`;
 * the serializers in `dining-catalogue.serializer.ts` are plain functions other
 * dining streams may import directly.
 */
@Module({
  controllers: [DiningCatalogueController],
  providers: [DiningCatalogueService],
  exports: [DiningCatalogueService],
})
export class DiningCatalogueModule {}
