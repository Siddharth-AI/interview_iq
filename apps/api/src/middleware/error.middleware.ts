import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import { ERROR_CODES, type ApiFailure } from '@interview-iq/shared';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';
import { MAX_FILE_SIZE_BYTES } from '../config/env';

function fail(res: Response, statusCode: number, body: ApiFailure): void {
  res.status(statusCode).json(body);
}

/** Global error handler. Must be registered last. Maps every error to the envelope. */
export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const requestId = req.requestId;

  if (err instanceof ZodError) {
    fail(res, 400, {
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        details: err.flatten().fieldErrors,
      },
      requestId,
    });
    return;
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ msg: err.message, code: err.code, requestId, stack: err.stack });
    }
    fail(res, err.statusCode, {
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
      requestId,
    });
    return;
  }

  if (err instanceof multer.MulterError) {
    const tooLarge = err.code === 'LIMIT_FILE_SIZE';
    fail(res, tooLarge ? 413 : 400, {
      success: false,
      error: {
        code: tooLarge ? ERROR_CODES.PAYLOAD_TOO_LARGE : ERROR_CODES.VALIDATION_ERROR,
        message: tooLarge
          ? `File exceeds the maximum size of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`
          : err.message,
      },
      requestId,
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      fail(res, 409, {
        success: false,
        error: { code: ERROR_CODES.CONFLICT, message: 'Resource already exists' },
        requestId,
      });
      return;
    }
    if (err.code === 'P2025') {
      fail(res, 404, {
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Resource not found' },
        requestId,
      });
      return;
    }
  }

  logger.error({ msg: 'Unhandled error', err, requestId });
  fail(res, 500, {
    success: false,
    error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Something went wrong' },
    requestId,
  });
}
