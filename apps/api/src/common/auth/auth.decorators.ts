import { SetMetadata } from '@nestjs/common';
import type { Role } from '@coastline/api-contracts';

export const ALLOW_ANONYMOUS = 'coastline:allow-anonymous';
export const REQUIRED_ROLES = 'coastline:required-roles';

/** Public endpoint. A demo identity header is still resolved when present. */
export const AllowAnonymous = (): MethodDecorator & ClassDecorator =>
  SetMetadata(ALLOW_ANONYMOUS, true);

/** Restricts a handler to the listed roles. */
export const Roles = (...roles: Role[]): MethodDecorator & ClassDecorator =>
  SetMetadata(REQUIRED_ROLES, roles);
