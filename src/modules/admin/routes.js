import { Router } from 'express';
import * as adminController from './controller.js';
import * as adminSchemas from './schemas.js';
import { validate } from '../../middlewares/validate.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/requireRole.js';

const router = Router();

// All routes require ADMIN role
router.use(authMiddleware, requireRole('ADMIN'));

// Users
router.get('/users', validate(adminSchemas.userFiltersSchema), adminController.listUsers);
router.get('/users/:id', validate(adminSchemas.userParamsSchema), adminController.getUser);
router.put('/users/:id', validate(adminSchemas.updateUserSchema), adminController.updateUser);
router.delete('/users/:id', validate(adminSchemas.userParamsSchema), adminController.deleteUser);

// Vacancies
router.get('/vacancies', validate(adminSchemas.vacancyFiltersSchema), adminController.listVacancies);
router.get('/vacancies/:id', validate(adminSchemas.vacancyParamsSchema), adminController.getVacancy);
router.put('/vacancies/:id', validate(adminSchemas.updateVacancySchema), adminController.updateVacancy);
router.delete('/vacancies/:id', validate(adminSchemas.vacancyParamsSchema), adminController.deleteVacancy);

export default router;