import { Body, Controller, Delete, Get, HttpCode, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  SAVED_ITEM_TYPES,
  type ApiEnvelope,
  type SaveItemRequest,
  type SavedItemDto,
  type SavedItemType,
} from '@coastline/api-contracts';
import { IsIn, IsString, Matches } from 'class-validator';
import type { Actor } from '../../common/auth/actor';
import { Roles } from '../../common/auth/auth.decorators';
import { CurrentActor } from '../../common/auth/current-actor.decorator';
import { SavedService } from './saved.service';

/** A hotel slug, a venue code, or "destination/spot". */
const KEY = /^[A-Za-z0-9-]{1,80}(\/[a-z0-9-]{1,80})?$/;

class SavedItemBody implements SaveItemRequest {
  @IsIn(SAVED_ITEM_TYPES)
  type!: SavedItemType;

  @IsString()
  @Matches(KEY, { message: 'key is not a valid saved item key' })
  key!: string;
}

@ApiTags('saved')
@Controller('saved')
@Roles('TOURIST')
export class SavedController {
  constructor(private readonly saved: SavedService) {}

  @Get()
  async list(@CurrentActor() actor: Actor): Promise<ApiEnvelope<SavedItemDto[]>> {
    return { data: await this.saved.list(actor.id) };
  }

  @Post()
  async save(
    @CurrentActor() actor: Actor,
    @Body() body: SavedItemBody,
  ): Promise<ApiEnvelope<SavedItemDto>> {
    return { data: await this.saved.save(actor.id, body.type, body.key) };
  }

  @Delete()
  @HttpCode(204)
  async remove(@CurrentActor() actor: Actor, @Query() query: SavedItemBody): Promise<void> {
    await this.saved.remove(actor.id, query.type, query.key);
  }
}
