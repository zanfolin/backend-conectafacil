import { z } from 'zod';
import { validateDocument } from '../../utils/cpfCnpj.js';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('E-mail inválido'),
    password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
    full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(255),
    user_type: z.enum(['CANDIDATE', 'RECRUITER']),
    document_type: z.enum(['CPF', 'CNPJ']),
    document_number: z.string().min(11, 'Documento inválido').max(18),
    phone: z.string().max(20).optional(),
  }).refine((data) => {
    // Validate document based on user_type and document_type
    if (data.user_type === 'CANDIDATE' && data.document_type !== 'CPF') {
      return false;
    }
    if (data.user_type === 'RECRUITER' && !['CPF', 'CNPJ'].includes(data.document_type)) {
      return false;
    }
    return validateDocument(data.document_number, data.document_type);
  }, {
    message: 'Documento inválido para o tipo de usuário',
    path: ['document_number'],
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    email: z.string().email('E-mail inválido'),
    code: z.string().length(6, 'Código deve ter 6 dígitos'),
  }),
});

export const resendVerificationSchema = z.object({
  body: z.object({
    email: z.string().email('E-mail inválido'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('E-mail inválido'),
    password: z.string().min(1, 'Senha é obrigatória'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('E-mail inválido'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('E-mail inválido'),
    code: z.string().length(6, 'Código deve ter 6 dígitos'),
    password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  }),
});