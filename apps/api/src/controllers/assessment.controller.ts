import type { Request, Response, RequestHandler } from 'express';
import { asyncHandler } from '../lib/async-handler';
import { sendSuccess } from '../lib/response';
import { requireUserId } from '../middleware/auth.middleware';
import { assessmentService } from '../services/assessment.service';

export const assessmentController: { get: RequestHandler } = {
  get: asyncHandler(async (req: Request, res: Response) => {
    const assessment = await assessmentService.getAssessment(req.params.id!, requireUserId(req));
    sendSuccess(res, assessment);
  }),
};
