import { Router } from 'express';
import * as authController from './controller.js';
import * as authSchemas from './schemas.js';
import { validate } from '../../middlewares/validate.js';
import { authMiddleware } from '../../middlewares/auth.js';

const router = Router();

// Public routes
router.post('/register', validate(authSchemas.registerSchema), authController.register);
router.post('/verify-email', validate(authSchemas.verifyEmailSchema), authController.verifyEmail);
router.post('/resend-verification', validate(authSchemas.resendVerificationSchema), authController.resendVerification);
router.post('/login', validate(authSchemas.loginSchema), authController.login);
router.post('/forgot-password', validate(authSchemas.forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(authSchemas.resetPasswordSchema), authController.resetPassword);

// Protected routes
router.get('/me', authMiddleware, authController.me);

export default router;