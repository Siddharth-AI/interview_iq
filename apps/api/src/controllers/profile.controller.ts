import type { Request, Response, RequestHandler } from 'express';
import { updateProfileSchema } from '@interview-iq/shared';
import { asyncHandler } from '../lib/async-handler';
import { sendSuccess } from '../lib/response';
import { requireUserId } from '../middleware/auth.middleware';
import { profileService } from '../services/profile.service';

export const profileController: { get: RequestHandler; update: RequestHandler } = {
  get: asyncHandler(async (req: Request, res: Response) => {
    const profile = await profileService.getProfile(req.params.id!, requireUserId(req));
    sendSuccess(res, profile);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const input = updateProfileSchema.parse(req.body);
    const profile = await profileService.updateProfile(req.params.id!, requireUserId(req), input);
    sendSuccess(res, profile);
  }),
};
