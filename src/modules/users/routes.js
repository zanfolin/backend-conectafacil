import { Router } from 'express';
import * as userController from './controller.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { upload } from '../../middlewares/upload.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.post('/me/avatar', upload.single('avatar'), userController.uploadAvatar);

export default router;