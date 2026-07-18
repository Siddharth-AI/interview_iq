import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

/** Assigns a correlation id to every request and echoes it back in the response header. */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers['x-request-id'];
  req.requestId = (typeof incoming === 'string' && incoming) || randomUUID();
  res.setHeader('x-request-id', req.requestId);
  next();
}
