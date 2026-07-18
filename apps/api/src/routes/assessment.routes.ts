import { Router } from 'express';
import { assessmentController } from '../controllers/assessment.controller';
import { authenticate } from '../middleware/auth.middleware';

export const assessmentRouter: Router = Router();

// GET /api/assessments/:id — retrieve final assessment results
assessmentRouter.get('/:id', authenticate, assessmentController.get);
