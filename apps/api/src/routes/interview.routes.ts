import { Router } from 'express';
import { interviewController } from '../controllers/interview.controller';
import { authenticate } from '../middleware/auth.middleware';
import { heavyRateLimit } from '../middleware/rate-limit.middleware';

export const interviewRouter: Router = Router();

interviewRouter.use(authenticate);

// POST /api/interviews            — create a personalised interview
interviewRouter.post('/', heavyRateLimit, interviewController.create);
// GET  /api/interviews/history    — history list (declared before /:id)
interviewRouter.get('/history', interviewController.history);
// GET  /api/interviews/:id        — load or resume
interviewRouter.get('/:id', interviewController.get);
// POST /api/interviews/:id/answers  — idempotent answer save
interviewRouter.post('/:id/answers', interviewController.saveAnswer);
// POST /api/interviews/:id/complete — complete and score
interviewRouter.post('/:id/complete', heavyRateLimit, interviewController.complete);
