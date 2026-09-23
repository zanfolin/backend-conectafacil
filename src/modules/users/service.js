import { getKnex } from '../../config/database.js';
import { unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export async function updateAvatar(userId, avatarFilename) {
  const knex = getKnex();

  // Get current avatar to delete old file
  const user = await knex('users')
    .where({ id: userId })
    .whereNull('deleted_at')
    .first('avatar_url');

  if (!user) {
    const err = new Error('Usuário não encontrado');
    err.statusCode = 404;
    throw err;
  }

  // Delete old avatar file if exists
  if (user.avatar_url) {
    const oldPath = join(process.cwd(), 'uploads', 'avatars', user.avatar_url);
    if (existsSync(oldPath)) {
      unlinkSync(oldPath);
    }
  }

  const avatarUrl = `/uploads/avatars/${avatarFilename}`;

  await knex('users')
    .where({ id: userId })
    .update({
      avatar_url: avatarFilename,
      updated_at: new Date().toISOString(),
    });

  return {
    user: {
      id: userId,
      avatar_url: avatarUrl,
    },
    message: 'Avatar atualizado com sucesso',
  };
}