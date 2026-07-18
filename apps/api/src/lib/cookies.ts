import type { CookieOptions, Response } from 'express';
import { env } from '../config/env';
import { durationToMs } from './jwt';

const isProd = env.NODE_ENV === 'production';

// In production the web app and API may sit on different domains, which requires
// SameSite=None; Secure for the browser to send cookies on cross-site requests.
const baseCookie: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  path: '/',
};

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string; refreshExpiresAt: Date },
): void {
  res.cookie(ACCESS_COOKIE, tokens.accessToken, {
    ...baseCookie,
    maxAge: durationToMs(env.JWT_ACCESS_EXPIRES_IN),
  });
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...baseCookie,
    maxAge: Math.max(0, tokens.refreshExpiresAt.getTime() - Date.now()),
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, baseCookie);
  res.clearCookie(REFRESH_COOKIE, baseCookie);
}
