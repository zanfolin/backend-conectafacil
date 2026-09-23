import * as userService from './service.js';

export async function uploadAvatar(req, res) {
  if (!req.file) {
    const err = new Error('Nenhum arquivo enviado');
    err.statusCode = 400;
    throw err;
  }

  const result = await userService.updateAvatar(req.user.id, req.file.filename);
  res.json(result);
}