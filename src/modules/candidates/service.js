import { getKnex } from '../../config/database.js';
import { sendApplicationNotificationEmail } from '../../utils/mailer.js';

export async function getProfile(userId) {
  const knex = getKnex();

  const user = await knex('users')
    .where({ id: userId, user_type: 'CANDIDATE' })
    .whereNull('deleted_at')
    .first('id', 'email', 'full_name', 'phone', 'avatar_url', 'document_type', 'document_number', 'active_notification', 'created_at');

  if (!user) {
    const err = new Error('Perfil de candidato não encontrado');
    err.statusCode = 404;
    throw err;
  }

  return { candidate: user };
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
    .where({ id: userId, user_type: 'CANDIDATE' })
    .whereNull('deleted_at')
    .update(updateData);

  return getProfile(userId);
}

export async function listVacancies(userId, filters) {
  const knex = getKnex();

  const {
    job_title,
    company_sector,
    salary_min,
    salary_max,
    work_model,
    contract_type,
    page = 1,
    limit = 10,
  } = filters;

  let query = knex('vacancies')
    .whereNull('deleted_at')
    .where({ status: 'OPEN' })
    .join('users', 'vacancies.user_id', 'users.id')
    .select(
      'vacancies.*',
      'users.email as company_email',
      'users.full_name as company_name'
    );

  if (job_title) {
    query = query.where('vacancies.job_title', 'like', `%${job_title}%`);
  }
  if (company_sector) {
    query = query.where('vacancies.company_sector', 'like', `%${company_sector}%`);
  }
  if (salary_min !== undefined) {
    query = query.where('vacancies.salary_max', '>=', salary_min);
  }
  if (salary_max !== undefined) {
    query = query.where('vacancies.salary_min', '<=', salary_max);
  }
  if (work_model) {
    query = query.where('vacancies.work_model', work_model);
  }
  if (contract_type) {
    query = query.where('vacancies.contract_type', contract_type);
  }

  // Get total count for pagination
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

export async function getVacancy(userId, vacancyId) {
  const knex = getKnex();

  const vacancy = await knex('vacancies')
    .where({ 'vacancies.id': vacancyId })
    .whereNull('vacancies.deleted_at')
    .where({ 'vacancies.status': 'OPEN' })
    .join('users', 'vacancies.user_id', 'users.id')
    .select(
      'vacancies.*',
      'users.email as company_email',
      'users.full_name as company_name',
      'users.phone as company_phone'
    )
    .first();

  if (!vacancy) {
    const err = new Error('Vaga não encontrada');
    err.statusCode = 404;
    throw err;
  }

  // Check if user already applied
  const existingInterest = await knex('interests')
    .where({ user_id: userId, vacancy_id: vacancyId })
    .first();

  return {
    vacancy: {
      ...vacancy,
      already_applied: !!existingInterest,
      application_status: existingInterest?.status || null,
    },
  };
}

export async function applyToVacancy(userId, vacancyId) {
  const knex = getKnex();

  // Check if vacancy exists and is open
  const vacancy = await knex('vacancies')
    .where({ id: vacancyId })
    .whereNull('deleted_at')
    .where({ status: 'OPEN' })
    .join('users', 'vacancies.user_id', 'users.id')
    .select('vacancies.*', 'users.email as recruiter_email', 'users.full_name as recruiter_name')
    .first();

  if (!vacancy) {
    const err = new Error('Vaga não encontrada ou não está aberta');
    err.statusCode = 404;
    throw err;
  }

  // Check if already applied
  const existing = await knex('interests')
    .where({ user_id: userId, vacancy_id: vacancyId })
    .first();

  if (existing) {
    const err = new Error('Você já se candidatou a esta vaga');
    err.code = 'SQLITE_CONSTRAINT_UNIQUE';
    throw err;
  }

  // Create interest
  await knex('interests').insert({
    user_id: userId,
    vacancy_id: vacancyId,
    status: 'PENDING',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // Get candidate info for email
  const candidate = await knex('users')
    .where({ id: userId })
    .first('full_name', 'email');

  // Send notification to recruiter
  await sendApplicationNotificationEmail(
    vacancy.recruiter_email,
    candidate.full_name,
    vacancy.job_title
  );

  return {
    message: 'Candidatura enviada com sucesso',
    application: {
      vacancy_id: vacancyId,
      status: 'PENDING',
      company_email: vacancy.recruiter_email,
    },
  };
}

export async function listApplications(userId) {
  const knex = getKnex();

  const applications = await knex('interests')
    .where({ user_id: userId })
    .join('vacancies', 'interests.vacancy_id', 'vacancies.id')
    .join('users as recruiters', 'vacancies.user_id', 'recruiters.id')
    .whereNull('vacancies.deleted_at')
    .select(
      'interests.id',
      'interests.status',
      'interests.created_at as applied_at',
      'interests.updated_at as status_updated_at',
      'vacancies.id as vacancy_id',
      'vacancies.job_title',
      'vacancies.company_name',
      'vacancies.company_sector',
      'vacancies.location',
      'vacancies.work_model',
      'vacancies.contract_type',
      'vacancies.salary_min',
      'vacancies.salary_max',
      'recruiters.email as company_email',
      'recruiters.full_name as company_name'
    )
    .orderBy('interests.created_at', 'desc');

  return { applications };
}

export async function deleteApplication(userId, vacancyId) {
  const knex = getKnex();

  const deleted = await knex('interests')
    .where({ user_id: userId, vacancy_id: vacancyId })
    .delete();

  if (deleted === 0) {
    const err = new Error('Candidatura não encontrada');
    err.statusCode = 404;
    throw err;
  }

  return { message: 'Candidatura removida com sucesso' };
}

export async function toggleNotification(userId, activeNotification) {
  const knex = getKnex();

  await knex('users')
    .where({ id: userId, user_type: 'CANDIDATE' })
    .whereNull('deleted_at')
    .update({
      active_notification: activeNotification,
      updated_at: new Date().toISOString(),
    });

  return { message: 'Preferência de notificação atualizada', active_notification: activeNotification };
}