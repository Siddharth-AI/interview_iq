import { PrismaClient } from '@prisma/client';
import { logger } from '../lib/logger';

const SLOW_QUERY_MS = 500;

declare global {
  // Reuse a single client across hot reloads in development.
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

// Surface slow queries so index problems are visible early.
prisma.$on('query' as never, (event: { duration: number; query: string }) => {
  if (event.duration > SLOW_QUERY_MS) {
    logger.warn({ msg: 'Slow query', durationMs: event.duration, query: event.query.slice(0, 300) });
  }
});

prisma.$on('error' as never, (event: { message: string }) => {
  logger.error({ msg: 'Prisma error', message: event.message });
});
