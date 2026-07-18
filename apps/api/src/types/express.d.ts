import type { AccessTokenPayload } from '../lib/jwt';

// Single source of truth for Request augmentation across middleware.
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: AccessTokenPayload;
    }
  }
}

export {};
