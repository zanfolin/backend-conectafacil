import { z } from 'zod';

export const userFiltersSchema = z.object({
  query: z.object({
    user_type: z.enum(['CANDIDATE', 'RECRUITER', 'ADMIN']).optional(),
    verified_email: z.coerce.boolean().optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(10),
  }),
});

export const userParamsSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    full_name: z.string().min(2).max(255).optional(),
    phone: z.string().max(20).optional(),
    active_notification: z.boolean().optional(),
    user_type: z.enum(['CANDIDATE', 'RECRUITER', 'ADMIN']).optional(),
    verified_email: z.boolean().optional(),
  }),
});

export const vacancyFiltersSchema = z.object({
  query: z.object({
    status: z.enum(['OPEN', 'CLOSED']).optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(10),
  }),
});

export const vacancyParamsSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const updateVacancySchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    status: z.enum(['OPEN', 'CLOSED']).optional(),
  }),
});