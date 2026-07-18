import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt';
import { unauthorized } from '../lib/errors';

/**
 * Authenticates a request from the access token, read from the httpOnly cookie first,
 * then the Authorization header. Populates req.user for downstream ownership checks.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const cookieToken = req.cookies?.access_token as string | undefined;
    const headerToken = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice('Bearer '.length)
      : undefined;
    const token = cookieToken ?? headerToken;

    if (!token) throw unauthorized('Authentication required');

    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    next(err);
  }
}

/** Returns the authenticated user id or throws. Use inside controllers after authenticate. */
export function requireUserId(req: Request): string {
  if (!req.user) throw unauthorized();
  return req.user.sub;
}
