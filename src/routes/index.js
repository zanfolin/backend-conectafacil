import { Router } from 'express';
import authRoutes from '../modules/auth/routes.js';
import userRoutes from '../modules/users/routes.js';
import candidateRoutes from '../modules/candidates/routes.js';
import recruiterRoutes from '../modules/recruiters/routes.js';
import adminRoutes from '../modules/admin/routes.js';

export const routes = Router();

routes.use('/auth', authRoutes);
routes.use('/users', userRoutes);
routes.use('/candidates', candidateRoutes);
routes.use('/recruiters', recruiterRoutes);
routes.use('/admin', adminRoutes);