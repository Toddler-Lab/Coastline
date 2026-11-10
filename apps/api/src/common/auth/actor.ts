import type { Role } from '@coastline/api-contracts';

/** Authenticated caller resolved by the demo guard (later: real auth). */
export interface Actor {
  id: string;
  name: string;
  email: string | null;
  role: Role;
}
