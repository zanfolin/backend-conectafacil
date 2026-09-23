import { verifyToken } from '../utils/jwt.js';
import { getKnex } from '../config/database.js';

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token de acesso não fornecido',
    });
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyToken(token);

    // Fetch user to ensure they still exist and get current type
    const knex = getKnex();
    const user = await knex('users')
      .where({ id: payload.sub })
      .whereNull('deleted_at')
      .first('id', 'user_type', 'verified_email');

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Usuário não encontrado',
      });
    }

    if (!user.verified_email) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'E-mail não verificado',
      });
    }

    req.user = {
      id: user.id,
      type: user.user_type,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token expirado',
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token inválido',
      });
    }
    throw err;
  }
}