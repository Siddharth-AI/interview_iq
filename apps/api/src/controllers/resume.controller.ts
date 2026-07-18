import type { Request, Response, RequestHandler } from 'express';
import { asyncHandler } from '../lib/async-handler';
import { sendSuccess } from '../lib/response';
import { badRequest } from '../lib/errors';
import { requireUserId } from '../middleware/auth.middleware';
import { resumeService } from '../services/resume.service';

export const resumeController: { upload: RequestHandler } = {
  upload: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    if (!req.file) throw badRequest('A resume file is required');

    const profile = await resumeService.processUpload(userId, {
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });
    sendSuccess(res, profile, 201);
  }),
};
