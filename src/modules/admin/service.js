import { getKnex } from '../../config/database.js';

export async function listUsers(filters) {
  const knex = getKnex();

  const { user_type, verified_email, search, page = 1, limit = 10 } = filters;

  let query = knex('users')
    .whereNull('deleted_at')
    .select('id', 'email', 'full_name', 'user_type', 'document_type', 'document_number', 'phone', 'avatar_url', 'verified_email', 'active_notification', 'created_at', 'updated_at');

  if (user_type) {
    query = query.where({ user_type });
  }
  if (verified_email !== undefined) {
    query = query.where({ verified_email });
  }
  if (search) {
    query = query.where(function() {
      this.where('email', 'like', `%${search}%`)
        .orWhere('full_name', 'like', `%${search}%`)
        .orWhere('document_number', 'like', `%${search}%`);
    });
  }

  const countQuery = query.clone().clearSelect().clearOrder().count('* as total');
  const [{ total }] = await countQuery;

  const offset = (page - 1) * limit;
  const users = await query
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);

  return {
    users,
    pagination: {
      page,
      limit,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / limit),
    },
  };
}

export async function getUser(userId) {
  const knex = getKnex();

  const user = await knex('users')
    .where({ id: userId })
    .whereNull('deleted_at')
    .first('id', 'email', 'full_name', 'user_type', 'document_type', 'document_number', 'phone', 'avatar_url', 'verified_email', 'active_notification', 'created_at', 'updated_at');

  if (!user) {
    const err = new Error('Usuário não encontrado');
    err.statusCode = 404;
    throw err;
  }

  return { user };
}

export async function updateUser(userId, data) {
  const knex = getKnex();

  const allowedFields = ['full_name', 'phone', 'active_notification', 'user_type', 'verified_email'];
  const updateData = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return getUser(userId);
  }

  updateData.updated_at = new Date().toISOString();

  await knex('users')
    .where({ id: userId })
    .whereNull('deleted_at')
    .update(updateData);

  return getUser(userId);
}

export async function deleteUser(userId) {
  const knex = getKnex();

  const user = await knex('users')
    .where({ id: userId })
    .whereNull('deleted_at')
    .first();

  if (!user) {
    const err = new Error('Usuário não encontrado');
    err.statusCode = 404;
    throw err;
  }

  try {
    // Try to delete - will fail if FK RESTRICT blocks it
    await knex('users')
      .where({ id: userId })
      .delete();
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
      const fkErr = new Error('Não é possível excluir usuário: existem registros vinculados (vagas ou candidaturas)');
      fkErr.statusCode = 409;
      throw fkErr;
    }
    throw err;
  }

  return { message: 'Usuário excluído com sucesso' };
}

export async function listVacancies(filters) {
  const knex = getKnex();

  const { status, search, page = 1, limit = 10 } = filters;

  let query = knex('vacancies')
    .join('users', 'vacancies.user_id', 'users.id')
    .select(
      'vacancies.*',
      'users.email as recruiter_email',
      'users.full_name as recruiter_name'
    );

  if (status) {
    query = query.where('vacancies.status', status);
  }
  if (search) {
    query = query.where(function() {
      this.where('vacancies.job_title', 'like', `%${search}%`)
        .orWhere('vacancies.company_name', 'like', `%${search}%`)
        .orWhere('users.full_name', 'like', `%${search}%`);
    });
  }

  const countQuery = query.clone().clearSelect().clearOrder().count('* as total');
  const [{ total }] = await countQuery;

  const offset = (page - 1) * limit;
  const vacancies = await query
    .orderBy('vacancies.created_at', 'desc')
    .limit(limit)
    .offset(offset);

  return {
    vacancies,
    pagination: {
      page,
      limit,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / limit),
    },
  };
}

export async function getVacancy(vacancyId) {
  const knex = getKnex();

  const vacancy = await knex('vacancies')
    .where({ 'vacancies.id': vacancyId })
    .join('users', 'vacancies.user_id', 'users.id')
    .select(
      'vacancies.*',
      'users.email as recruiter_email',
      'users.full_name as recruiter_name'
    )
    .first();

  if (!vacancy) {
    const err = new Error('Vaga não encontrada');
    err.statusCode = 404;
    throw err;
  }

  return { vacancy };
}

export async function updateVacancy(vacancyId, data) {
  const knex = getKnex();

  const vacancy = await knex('vacancies')
    .where({ id: vacancyId })
    .first();

  if (!vacancy) {
    const err = new Error('Vaga não encontrada');
    err.statusCode = 404;
    throw err;
  }

  const allowedFields = ['status'];
  const updateData = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return getVacancy(vacancyId);
  }

  updateData.updated_at = new Date().toISOString();

  // If setting to CLOSED, also set deleted_at for soft delete
  if (updateData.status === 'CLOSED' && !vacancy.deleted_at) {
    updateData.deleted_at = new Date().toISOString();
  }

  await knex('vacancies')
    .where({ id: vacancyId })
    .update(updateData);

  return getVacancy(vacancyId);
}

export async function deleteVacancy(vacancyId) {
  const knex = getKnex();

  const vacancy = await knex('vacancies')
    .where({ id: vacancyId })
    .first();

  if (!vacancy) {
    const err = new Error('Vaga não encontrada');
    err.statusCode = 404;
    throw err;
  }

  // Soft delete
  await knex('vacancies')
    .where({ id: vacancyId })
    .update({
      status: 'CLOSED',
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  return { message: 'Vaga removida com sucesso (soft delete)' };
}