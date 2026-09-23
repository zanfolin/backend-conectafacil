import { Router } from 'express';
import * as candidateController from './controller.js';
import * as candidateSchemas from './schemas.js';
import { validate } from '../../middlewares/validate.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/requireRole.js';

const router = Router();

// All routes require CANDIDATE role
router.use(authMiddleware, requireRole('CANDIDATE'));

router.get('/profile', candidateController.getProfile);
router.put('/profile', validate(candidateSchemas.updateProfileSchema), candidateController.updateProfile);

router.get('/vacancies', validate(candidateSchemas.vacancyFiltersSchema), candidateController.listVacancies);
router.get('/vacancies/:id', validate(candidateSchemas.applyVacancySchema), candidateController.getVacancy);
router.post('/vacancies/:id/apply', validate(candidateSchemas.applyVacancySchema), candidateController.applyToVacancy);

router.get('/applications', candidateController.listApplications);
router.delete('/applications/:vacancyId', validate(candidateSchemas.deleteApplicationSchema), candidateController.deleteApplication);

router.patch('/notifications', validate(candidateSchemas.toggleNotificationSchema), candidateController.toggleNotification);

export default router;