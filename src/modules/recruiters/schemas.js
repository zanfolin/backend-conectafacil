import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    full_name: z.string().min(2).max(255).optional(),
    phone: z.string().max(20).optional(),
    active_notification: z.boolean().optional(),
  }),
});

export const createVacancySchema = z.object({
  body: z.object({
    job_title: z.string().min(3).max(255),
    company_name: z.string().min(2).max(255),
    company_sector: z.string().max(100).optional(),
    job_description: z.string().min(10),
    requirements: z.string().max(1000).optional(),
    benefits: z.string().max(1000).optional(),
    location: z.string().max(255).optional(),
    work_model: z.enum(['REMOTE', 'HYBRID', 'ONSITE']).default('ONSITE'),
    contract_type: z.enum(['CLT', 'PJ', 'INTERNSHIP', 'FREELANCE']).default('CLT'),
    salary_min: z.coerce.number().positive().optional(),
    salary_max: z.coerce.number().positive().optional(),
  }).refine(data => {
    if (data.salary_min && data.salary_max) {
      return data.salary_min <= data.salary_max;
    }
    return true;
  }, {
    message: 'salary_min deve ser menor ou igual a salary_max',
    path: ['salary_min'],
  }),
});

export const updateVacancySchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    job_title: z.string().min(3).max(255).optional(),
    company_name: z.string().min(2).max(255).optional(),
    company_sector: z.string().max(100).optional(),
    job_description: z.string().min(10).optional(),
    requirements: z.string().max(1000).optional(),
    benefits: z.string().max(1000).optional(),
    location: z.string().max(255).optional(),
    work_model: z.enum(['REMOTE', 'HYBRID', 'ONSITE']).optional(),
    contract_type: z.enum(['CLT', 'PJ', 'INTERNSHIP', 'FREELANCE']).optional(),
    salary_min: z.coerce.number().positive().optional(),
    salary_max: z.coerce.number().positive().optional(),
    status: z.enum(['OPEN', 'CLOSED']).optional(),
  }).refine(data => {
    if (data.salary_min && data.salary_max) {
      return data.salary_min <= data.salary_max;
    }
    return true;
  }, {
    message: 'salary_min deve ser menor ou igual a salary_max',
    path: ['salary_min'],
  }),
});

export const vacancyParamsSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const updateCandidateStatusSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
    userId: z.coerce.number().int().positive(),
  }),
  body: z.object({
    status: z.enum(['ACCEPTED', 'REJECTED']),
  }),
});

export const listCandidatesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(10),
  }),
});