import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type {
  ApiEnvelope,
  DestinationDetailDto,
  DestinationSummaryDto,
  SpotDetailDto,
} from '@coastline/api-contracts';
import { AllowAnonymous } from '../../common/auth/auth.decorators';
import { notFound } from '../../common/errors/api-errors';
import { PlacesService } from './places.service';

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function slug(value: string, what: string): string {
  if (!SLUG.test(value) || value.length > 80) {
    throw notFound(`${what} not found.`);
  }
  return value;
}

@ApiTags('places')
@Controller('destinations')
@AllowAnonymous()
export class PlacesController {
  constructor(private readonly places: PlacesService) {}

  @Get()
  async list(): Promise<ApiEnvelope<DestinationSummaryDto[]>> {
    return { data: await this.places.listDestinations() };
  }

  @Get(':destination')
  async destination(
    @Param('destination') destination: string,
  ): Promise<ApiEnvelope<DestinationDetailDto>> {
    return { data: await this.places.getDestination(slug(destination, 'Destination')) };
  }

  @Get(':destination/spots/:spot')
  async spot(
    @Param('destination') destination: string,
    @Param('spot') spot: string,
  ): Promise<ApiEnvelope<SpotDetailDto>> {
    return {
      data: await this.places.getSpot(slug(destination, 'Destination'), slug(spot, 'Spot')),
    };
  }
}
