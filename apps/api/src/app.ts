import express, { type Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { ERROR_CODES } from '@interview-iq/shared';
import { env } from './config/env';
import { requestId } from './middleware/request-id.middleware';
import { httpLogger } from './middleware/http-logger.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { globalRateLimit } from './middleware/rate-limit.middleware';
import { apiRouter } from './routes';

export function createApp(): Application {
  const app = express();

  // Behind a proxy (Render, Fly, Nginx) so req.ip and rate limiting see the real client.
  app.set('trust proxy', 1);

  app.use(helmet());
  app.disable('x-powered-by');

  // Normalise a trailing slash so a value like "https://app.vercel.app/" still matches
  // the browser Origin header, which never carries a trailing slash.
  const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, '');
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => stripTrailingSlash(o.trim()));
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(stripTrailingSlash(origin))) {
          callback(null, true);
          return;
        }
        callback(new Error(`CORS blocked for origin ${origin}`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    }),
  );

  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  app.use(requestId);
  app.use(httpLogger);
  app.use(globalRateLimit);

  app.use('/api', apiRouter);

  // 404 for anything unmatched.
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: { code: ERROR_CODES.NOT_FOUND, message: 'Route not found' },
      requestId: req.requestId,
    });
  });

  app.use(errorMiddleware);

  return app;
}
