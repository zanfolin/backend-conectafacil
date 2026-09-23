import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    full_name: z.string().min(2).max(255).optional(),
    phone: z.string().max(20).optional(),
    active_notification: z.boolean().optional(),
  }),
});

export const vacancyFiltersSchema = z.object({
  query: z.object({
    job_title: z.string().optional(),
    company_sector: z.string().optional(),
    salary_min: z.coerce.number().optional(),
    salary_max: z.coerce.number().optional(),
    work_model: z.enum(['REMOTE', 'HYBRID', 'ONSITE']).optional(),
    contract_type: z.enum(['CLT', 'PJ', 'INTERNSHIP', 'FREELANCE']).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(10),
  }),
});

export const applyVacancySchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const deleteApplicationSchema = z.object({
  params: z.object({
    vacancyId: z.coerce.number().int().positive(),
  }),
});

export const toggleNotificationSchema = z.object({
  body: z.object({
    active_notification: z.boolean(),
  }),
});