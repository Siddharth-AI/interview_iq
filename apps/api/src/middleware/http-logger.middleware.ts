import type { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

/** Logs one structured line per completed request with method, status, and duration. */
export function httpLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      msg: 'http_request',
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
      requestId: req.requestId,
      ip: req.ip,
    });
  });
  next();
}
