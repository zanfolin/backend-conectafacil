import { Router } from 'express';
import * as recruiterController from './controller.js';
import * as recruiterSchemas from './schemas.js';
import { validate } from '../../middlewares/validate.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/requireRole.js';

const router = Router();

// All routes require RECRUITER role
router.use(authMiddleware, requireRole('RECRUITER'));

router.get('/profile', recruiterController.getProfile);
router.put('/profile', validate(recruiterSchemas.updateProfileSchema), recruiterController.updateProfile);

router.post('/vacancies', validate(recruiterSchemas.createVacancySchema), recruiterController.createVacancy);
router.get('/vacancies', validate(recruiterSchemas.listCandidatesSchema), recruiterController.listMyVacancies);
router.get('/vacancies/:id', validate(recruiterSchemas.vacancyParamsSchema), recruiterController.getMyVacancy);
router.put('/vacancies/:id', validate(recruiterSchemas.updateVacancySchema), recruiterController.updateVacancy);
router.delete('/vacancies/:id', validate(recruiterSchemas.vacancyParamsSchema), recruiterController.deleteVacancy);

router.get('/vacancies/:id/candidates', validate(recruiterSchemas.listCandidatesSchema), recruiterController.listCandidatesForVacancy);
router.patch('/vacancies/:id/candidates/:userId/status', validate(recruiterSchemas.updateCandidateStatusSchema), recruiterController.updateCandidateStatus);

router.get('/candidates/:id', validate(recruiterSchemas.vacancyParamsSchema), recruiterController.getCandidateProfile);

export default router;