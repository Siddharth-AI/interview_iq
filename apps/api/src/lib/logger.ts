import pino from 'pino';
import { env } from '../config/env';

/**
 * Structured logger. Redacts sensitive fields so tokens, passwords, and hashes
 * never reach the logs.
 */
export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : env.NODE_ENV === 'test' ? 'silent' : 'debug',
  ...(env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
    },
  }),
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'passwordHash',
      'password_hash',
      'accessToken',
      'refreshToken',
      'token',
      '*.password',
      '*.passwordHash',
    ],
    censor: '[REDACTED]',
  },
});
