import { ZodError } from 'zod';
import { env } from '../config/env.js';

export function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err);

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Dados de entrada inválidos',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // SQLite constraint errors
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    const field = err.message.match(/UNIQUE constraint failed: (\w+)/)?.[1] || 'field';
    return res.status(409).json({
      error: 'Conflict',
      message: `${field} já existe`,
    });
  }

  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return res.status(409).json({
      error: 'Conflict',
      message: 'Operação bloqueada por restrição de integridade referencial',
    });
  }

  if (err.code === 'SQLITE_CONSTRAINT_CHECK') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Valor inválido para campo com restrição CHECK',
    });
  }

  // Multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Arquivo muito grande. Máximo: ${env.MAX_AVATAR_MB}MB`,
      });
    }
    return res.status(400).json({
      error: 'Bad Request',
      message: err.message,
    });
  }

  // Custom error with statusCode
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.name || 'Error',
      message: err.message,
    });
  }

  // Default 500
  const message = env.NODE_ENV === 'production'
    ? 'Erro interno do servidor'
    : err.message || 'Erro interno do servidor';

  res.status(500).json({
    error: 'Internal Server Error',
    message,
  });
}