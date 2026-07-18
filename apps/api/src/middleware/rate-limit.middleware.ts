import { rateLimit } from 'express-rate-limit';
import { ERROR_CODES } from '@interview-iq/shared';
import { env } from '../config/env';

const rateLimitedBody = {
  success: false as const,
  error: { code: ERROR_CODES.RATE_LIMITED, message: 'Too many requests, please slow down' },
};

/** General API limiter applied globally. */
export const globalRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitedBody,
});

/** Strict limiter for auth endpoints to blunt credential stuffing. */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitedBody,
});

/** Tighter limiter for expensive resume upload and AI generation endpoints. */
export const heavyRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitedBody,
});
