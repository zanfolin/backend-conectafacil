import { z } from 'zod';

const insecureJwtSecrets = new Set([
  'your-super-secret-jwt-key-change-in-production',
  'change-me',
  'change-in-production',
  'replace-with-a-random-secret-of-at-least-32-characters',
]);

const placeholderSmtpValues = new Set([
  'smtp.example.com',
  'your-smtp-user',
  'your-smtp-password',
]);

const envSchema = z.object({
  // Server
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Database
  DATABASE_PATH: z.string().default('./data/conectafacil.db'),

  // SMTP
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('ConectaFácil <noreply@conectafacil.com>'),

  // Upload
  UPLOAD_DIR: z.string().default('./uploads/avatars'),
  MAX_AVATAR_MB: z.coerce.number().int().positive().default(2),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

if (parsed.data.NODE_ENV === 'production') {
  if (insecureJwtSecrets.has(parsed.data.JWT_SECRET.toLowerCase())) {
    console.error('JWT_SECRET inseguro: use um segredo aleatório em produção.');
    process.exit(1);
  }

  const smtpValues = [parsed.data.SMTP_HOST, parsed.data.SMTP_USER, parsed.data.SMTP_PASS];
  if (smtpValues.some((value) => !value || placeholderSmtpValues.has(value.toLowerCase()))) {
    console.error('SMTP_HOST, SMTP_USER e SMTP_PASS são obrigatórios em produção.');
    process.exit(1);
  }
}

export const env = parsed.data;