import type { Request, Response, RequestHandler } from 'express';
import { createInterviewSchema, saveAnswerSchema } from '@interview-iq/shared';
import { asyncHandler } from '../lib/async-handler';
import { sendSuccess } from '../lib/response';
import { requireUserId } from '../middleware/auth.middleware';
import { interviewService } from '../services/interview.service';

export const interviewController: {
  create: RequestHandler;
  get: RequestHandler;
  saveAnswer: RequestHandler;
  complete: RequestHandler;
  history: RequestHandler;
} = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const input = createInterviewSchema.parse(req.body);
    const interview = await interviewService.createInterview(requireUserId(req), input);
    sendSuccess(res, interview, 201);
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const interview = await interviewService.getInterview(req.params.id!, requireUserId(req));
    sendSuccess(res, interview);
  }),

  saveAnswer: asyncHandler(async (req: Request, res: Response) => {
    const input = saveAnswerSchema.parse(req.body);
    const answer = await interviewService.saveAnswer(req.params.id!, requireUserId(req), input);
    sendSuccess(res, answer);
  }),

  complete: asyncHandler(async (req: Request, res: Response) => {
    const assessment = await interviewService.completeInterview(
      req.params.id!,
      requireUserId(req),
    );
    sendSuccess(res, assessment, 201);
  }),

  history: asyncHandler(async (req: Request, res: Response) => {
    const history = await interviewService.listHistory(requireUserId(req));
    sendSuccess(res, history);
  }),
};
