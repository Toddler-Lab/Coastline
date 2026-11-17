import { Module } from '@nestjs/common';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { IdentityController } from './identity.controller';

@Module({ imports: [WorkspacesModule], controllers: [IdentityController] })
export class IdentityModule {}
