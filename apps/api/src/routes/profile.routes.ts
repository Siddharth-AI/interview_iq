import { Router } from 'express';
import { profileController } from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth.middleware';

export const profileRouter: Router = Router();

profileRouter.get('/:id', authenticate, profileController.get);
profileRouter.patch('/:id', authenticate, profileController.update);
