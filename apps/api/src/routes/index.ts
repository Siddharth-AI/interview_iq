import { Router } from 'express';
import { authRouter } from './auth.routes';
import { resumeRouter } from './resume.routes';
import { profileRouter } from './profile.routes';
import { interviewRouter } from './interview.routes';
import { assessmentRouter } from './assessment.routes';
import { healthRouter } from './health.routes';

export const apiRouter: Router = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/resumes', resumeRouter);
apiRouter.use('/profiles', profileRouter);
apiRouter.use('/interviews', interviewRouter);
apiRouter.use('/assessments', assessmentRouter);
