import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,100}$/;

/** Accepts a caller-supplied request id when it is safe, otherwise mints one. */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const supplied = req.header('x-request-id');
  const requestId = supplied && REQUEST_ID_PATTERN.test(supplied) ? supplied : randomUUID();

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}
