export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Autenticação necessária',
      });
    }

    if (!allowedRoles.includes(req.user.type)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Acesso negado: perfil insuficiente',
      });
    }

    next();
  };
}