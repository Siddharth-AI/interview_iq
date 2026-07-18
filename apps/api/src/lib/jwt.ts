import { createHash, randomBytes } from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { unauthorized } from './errors';

export interface AccessTokenPayload {
  sub: string; // user id
  email: string;
}

/** Sign a short-lived access token (JWT). */
export function signAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

/** Verify and decode an access token, throwing a 401 AppError if invalid. */
export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    if (typeof decoded === 'string') throw new Error('Unexpected token payload');
    return { sub: String(decoded.sub), email: String(decoded.email) };
  } catch {
    throw unauthorized('Invalid or expired session');
  }
}

/**
 * Refresh tokens are opaque random strings, not JWTs. Only their SHA-256 hash is
 * stored, so a database leak cannot be replayed. Rotation happens on every refresh.
 */
export function generateRefreshToken(): { token: string; tokenHash: string } {
  const token = randomBytes(48).toString('base64url');
  return { token, tokenHash: hashRefreshToken(token) };
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Parse a duration string like "7d" into milliseconds for cookie/expiry math. */
export function durationToMs(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) return 0;
  const amount = Number(match[1]);
  const unit = match[2];
  if (!unit) return 0;
  const unitMs: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return amount * (unitMs[unit] ?? 0);
}
