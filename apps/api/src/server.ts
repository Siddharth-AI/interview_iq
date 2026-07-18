import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './database/prisma';

async function bootstrap(): Promise<void> {
  // Connect to the database at startup so connectivity problems are visible immediately
  // in the logs, rather than surfacing later as a failed request.
  try {
    await prisma.$connect();
    logger.info({ msg: 'Database connected' });
  } catch (err) {
    logger.error({ msg: 'Database connection failed at startup', err });
  }

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info({ msg: 'API started', port: env.PORT, env: env.NODE_ENV });
  });

  const shutdown = (signal: string): void => {
    logger.info({ msg: `${signal} received, shutting down` });
    server.close(() => {
      void prisma.$disconnect().finally(() => process.exit(0));
    });
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 15_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // An uncaught exception leaves the process in an undefined state, so exit and let the
  // platform restart it.
  process.on('uncaughtException', (err) => {
    logger.fatal({ msg: 'Uncaught exception', err });
    process.exit(1);
  });

  // A stray unhandled rejection should be logged with its real details (the `err` key
  // triggers the logger's error serializer), but it must not take the whole server down.
  process.on('unhandledRejection', (reason) => {
    logger.error({ msg: 'Unhandled rejection', err: reason });
  });
}

void bootstrap();
