import type { Response } from 'express';
import type { ApiSuccess } from '@interview-iq/shared';

/** Send a success envelope with the standard shape. */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: Record<string, unknown>,
): void {
  const body: ApiSuccess<T> = {
    success: true,
    data,
    requestId: res.req.requestId,
    ...(meta ? { meta } : {}),
  };
  res.status(statusCode).json(body);
}
