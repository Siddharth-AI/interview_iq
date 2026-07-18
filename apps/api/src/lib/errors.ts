import { ERROR_CODES, type ErrorCode } from '@interview-iq/shared';

/**
 * Application error carrying a stable code and HTTP status. Thrown from services and
 * translated to the uniform response envelope by the error middleware.
 */
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new AppError(ERROR_CODES.VALIDATION_ERROR, message, 400, details);

export const unauthorized = (message = 'Not authenticated') =>
  new AppError(ERROR_CODES.UNAUTHORIZED, message, 401);

export const forbidden = (message = 'You do not have access to this resource') =>
  new AppError(ERROR_CODES.FORBIDDEN, message, 403);

export const notFound = (message = 'Resource not found') =>
  new AppError(ERROR_CODES.NOT_FOUND, message, 404);

export const conflict = (message = 'Resource already exists') =>
  new AppError(ERROR_CODES.CONFLICT, message, 409);

export const unprocessable = (message: string, details?: unknown) =>
  new AppError(ERROR_CODES.UNPROCESSABLE, message, 422, details);
