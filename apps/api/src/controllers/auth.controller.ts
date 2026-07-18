import type { Request, Response, RequestHandler } from 'express';
import { registerSchema, loginSchema } from '@interview-iq/shared';
import { asyncHandler } from '../lib/async-handler';
import { sendSuccess } from '../lib/response';
import { unauthorized } from '../lib/errors';
import { setAuthCookies, clearAuthCookies, REFRESH_COOKIE } from '../lib/cookies';
import { requireUserId } from '../middleware/auth.middleware';
import { authService, type IssuedSession } from '../services/auth.service';

function respondWithSession(res: Response, session: IssuedSession, statusCode: number): void {
  setAuthCookies(res, session);
  // The access token is also returned so non-browser clients can use the Authorization header.
  sendSuccess(res, { user: session.user, accessToken: session.accessToken }, statusCode);
}

export const authController: {
  register: RequestHandler;
  login: RequestHandler;
  refresh: RequestHandler;
  logout: RequestHandler;
  me: RequestHandler;
} = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const input = registerSchema.parse(req.body);
    const session = await authService.register(input, req.headers['user-agent']);
    respondWithSession(res, session, 201);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const input = loginSchema.parse(req.body);
    const session = await authService.login(input, req.headers['user-agent']);
    respondWithSession(res, session, 200);
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!token) throw unauthorized('No active session');
    const session = await authService.refresh(token, req.headers['user-agent']);
    respondWithSession(res, session, 200);
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    await authService.logout(requireUserId(req));
    clearAuthCookies(res);
    sendSuccess(res, { loggedOut: true });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.me(requireUserId(req));
    sendSuccess(res, { user });
  }),
};
