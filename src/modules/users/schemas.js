import { z } from 'zod';

export const uploadAvatarSchema = z.object({
  // Multer handles file validation, this is just for body params if any
  body: z.object({}).optional(),
});