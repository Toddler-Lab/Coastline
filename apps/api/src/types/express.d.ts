import type { Actor } from '../common/auth/actor';

declare global {
  namespace Express {
    interface Request {
      actor?: Actor;
      requestId?: string;
    }
  }
}

export {};
