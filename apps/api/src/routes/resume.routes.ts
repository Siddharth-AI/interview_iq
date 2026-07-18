import { Router } from 'express';
import { resumeController } from '../controllers/resume.controller';
import { authenticate } from '../middleware/auth.middleware';
import { heavyRateLimit } from '../middleware/rate-limit.middleware';
import { uploadResume } from '../middleware/upload.middleware';

export const resumeRouter: Router = Router();

// POST /api/resumes  — upload and process a resume
resumeRouter.post('/', authenticate, heavyRateLimit, uploadResume, resumeController.upload);
