import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './database/prisma';

function bootstrap(): void {
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
  process.on('uncaughtException', (err) => {
    logger.fatal({ msg: 'Uncaught exception', err });
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    logger.fatal({ msg: 'Unhandled rejection', reason });
    process.exit(1);
  });
}

bootstrap();
