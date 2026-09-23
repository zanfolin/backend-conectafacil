import { getKnex } from '../../config/database.js';
import { sendApplicationStatusEmail, sendVacancyUpdateEmail } from '../../utils/mailer.js';

async function getOwnedVacancy(userId, vacancyId) {
  const knex = getKnex();
  const vacancy = await knex('vacancies')
    .where({ id: vacancyId })
    .whereNull('deleted_at')
    .first();

  if (!vacancy) {
    const err = new Error('Vaga não encontrada');
    err.statusCode = 404;
    throw err;
  }

  if (vacancy.user_id !== userId) {
    const err = new Error('Você não tem permissão para acessar esta vaga');
    err.statusCode = 403;
    throw err;
  }

  return vacancy;
}

export async function getProfile(userId) {
  const knex = getKnex();

  const user = await knex('users')
    .where({ id: userId, user_type: 'RECRUITER' })
    .whereNull('deleted_at')
    .first('id', 'email', 'full_name', 'phone', 'avatar_url', 'document_type', 'document_number', 'active_notification', 'created_at');

  if (!user) {
    const err = new Error('Perfil de recrutador não encontrado');
    err.statusCode = 404;
    throw err;
  }

  return { recruiter: user };
}

export async function updateProfile(userId, data) {
  const knex = getKnex();

  const allowedFields = ['full_name', 'phone', 'active_notification'];
  const updateData = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return getProfile(userId);
  }

  updateData.updated_at = new Date().toISOString();

  await knex('users')
    .where({ id: userId, user_type: 'RECRUITER' })
    .whereNull('deleted_at')
    .update(updateData);

  return getProfile(userId);
}

export async function createVacancy(userId, data) {
  const knex = getKnex();

  const [vacancy] = await knex('vacancies').insert({
    user_id: userId,
    job_title: data.job_title,
    company_name: data.company_name,
    company_sector: data.company_sector || null,
    job_description: data.job_description,
    requirements: data.requirements || null,
    benefits: data.benefits || null,
    location: data.location || null,
    work_model: data.work_model,
    contract_type: data.contract_type,
    salary_min: data.salary_min || null,
    salary_max: data.salary_max || null,
    status: 'OPEN',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  }).returning('*');

  return { vacancy };
}

export async function listMyVacancies(userId, filters) {
  const knex = getKnex();

  const { page = 1, limit = 10 } = filters;

  let query = knex('vacancies')
    .where({ user_id: userId })
    .whereNull('deleted_at');

  const countQuery = query.clone().clearSelect().clearOrder().count('* as total');
  const [{ total }] = await countQuery;

  const offset = (page - 1) * limit;
  const vacancies = await query
    .orderBy('created_at', 'desc')
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

export async function getMyVacancy(userId, vacancyId) {
  const vacancy = await getOwnedVacancy(userId, vacancyId);

  return { vacancy };
}

export async function updateVacancy(userId, vacancyId, data) {
  const knex = getKnex();

  const vacancy = await getOwnedVacancy(userId, vacancyId);

  const allowedFields = [
    'job_title', 'company_name', 'company_sector', 'job_description',
    'requirements', 'benefits', 'location', 'work_model', 'contract_type',
    'salary_min', 'salary_max', 'status'
  ];

  const updateData = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return getMyVacancy(userId, vacancyId);
  }

  updateData.updated_at = new Date().toISOString();

  await knex('vacancies')
    .where({ id: vacancyId })
    .update(updateData);

  // Notify every interested candidate who enabled vacancy notifications.
  const updatedFields = Object.keys(updateData).filter(f => f !== 'updated_at' && f !== 'status');
  if (updatedFields.length > 0) {
    const interestedCandidates = await knex('interests')
      .where({ vacancy_id: vacancyId })
      .join('users', 'interests.user_id', 'users.id')
      .where('users.active_notification', true)
      .whereNull('users.deleted_at')
      .select('users.email', 'users.full_name');

    const updatedVacancy = await knex('vacancies').where({ id: vacancyId }).first('job_title');

    for (const candidate of interestedCandidates) {
      await sendVacancyUpdateEmail(candidate.email, updatedVacancy.job_title);
    }
  }

  return getMyVacancy(userId, vacancyId);
}

export async function deleteVacancy(userId, vacancyId) {
  const knex = getKnex();

  await getOwnedVacancy(userId, vacancyId);

  // Soft delete: set status to CLOSED and deleted_at
  await knex('vacancies')
    .where({ id: vacancyId })
    .update({
      status: 'CLOSED',
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  return { message: 'Vaga removida com sucesso (soft delete)' };
}

export async function listCandidatesForVacancy(userId, vacancyId, filters) {
  const knex = getKnex();

  const { page = 1, limit = 10 } = filters;

  await getOwnedVacancy(userId, vacancyId);

  let query = knex('interests')
    .where({ vacancy_id: vacancyId })
    .join('users', 'interests.user_id', 'users.id')
    .whereNull('users.deleted_at')
    .select(
      'interests.id',
      'interests.status',
      'interests.created_at as applied_at',
      'interests.updated_at as status_updated_at',
      'users.id as candidate_id',
      'users.email',
      'users.full_name',
      'users.phone',
      'users.avatar_url',
      'users.document_type',
      'users.document_number'
    );

  const countQuery = query.clone().clearSelect().clearOrder().count('* as total');
  const [{ total }] = await countQuery;

  const offset = (page - 1) * limit;
  const candidates = await query
    .orderBy('interests.created_at', 'desc')
    .limit(limit)
    .offset(offset);

  return {
    candidates,
    pagination: {
      page,
      limit,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / limit),
    },
  };
}

export async function updateCandidateStatus(userId, vacancyId, candidateId, status) {
  const knex = getKnex();

  const vacancy = await getOwnedVacancy(userId, vacancyId);

  // Check if candidate applied
  const interest = await knex('interests')
    .where({ vacancy_id: vacancyId, user_id: candidateId })
    .first();

  if (!interest) {
    const err = new Error('Candidato não se candidatou a esta vaga');
    err.statusCode = 404;
    throw err;
  }

  await knex('interests')
    .where({ id: interest.id })
    .update({
      status,
      updated_at: new Date().toISOString(),
    });

  // Get candidate info for email
  const candidate = await knex('users')
    .where({ id: candidateId })
    .first('email', 'full_name');

  // Send email to candidate
  await sendApplicationStatusEmail(candidate.email, vacancy.job_title, status);

  return {
    message: `Candidatura ${status === 'ACCEPTED' ? 'aceita' : 'rejeitada'} com sucesso`,
    application: {
      vacancy_id: vacancyId,
      candidate_id: candidateId,
      status,
    },
  };
}

export async function getCandidateProfile(userId, candidateId) {
  const knex = getKnex();

  // Verify recruiter exists
  const recruiter = await knex('users')
    .where({ id: userId, user_type: 'RECRUITER' })
    .whereNull('deleted_at')
    .first();

  if (!recruiter) {
    const err = new Error('Recrutador não encontrado');
    err.statusCode = 404;
    throw err;
  }

  const candidate = await knex('users')
    .where({ id: candidateId, user_type: 'CANDIDATE' })
    .whereNull('deleted_at')
    .first('id', 'email', 'full_name', 'phone', 'avatar_url', 'document_type', 'document_number', 'created_at');

  if (!candidate) {
    const err = new Error('Candidato não encontrado');
    err.statusCode = 404;
    throw err;
  }

  return { candidate };
}