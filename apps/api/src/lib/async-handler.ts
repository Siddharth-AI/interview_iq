import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async route handler so any rejection is forwarded to the error middleware.
 * Removes repetitive try/catch from controllers.
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
