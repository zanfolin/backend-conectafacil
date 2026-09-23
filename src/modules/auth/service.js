import bcrypt from 'bcryptjs';
import { getKnex } from '../../config/database.js';
import { signToken, generateVerificationCode, createAuthTokens } from '../../utils/jwt.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../../utils/mailer.js';

const CODE_EXPIRY_MINUTES = 10;

export async function registerUser(data) {
  const knex = getKnex();

  // Check if email already exists
  const existingEmail = await knex('users').where({ email: data.email }).first();
  if (existingEmail) {
    const err = new Error('E-mail já cadastrado');
    err.code = 'SQLITE_CONSTRAINT_UNIQUE';
    throw err;
  }

  // Check if document already exists
  const existingDoc = await knex('users').where({ document_number: data.document_number }).first();
  if (existingDoc) {
    const err = new Error('Documento já cadastrado');
    err.code = 'SQLITE_CONSTRAINT_UNIQUE';
    throw err;
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  const code = generateVerificationCode();
  const codeExpiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000).toISOString();

  const [user] = await knex('users').insert({
    email: data.email,
    password_hash: passwordHash,
    full_name: data.full_name,
    user_type: data.user_type,
    document_type: data.document_type,
    document_number: data.document_number,
    phone: data.phone || null,
    avatar_url: null,
    verified_email: false,
    code_email_verification: code,
    code_expires_at: codeExpiresAt,
    active_notification: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  }).returning(['id', 'email', 'full_name', 'user_type', 'verified_email']);

  // Send verification email
  await sendVerificationEmail(data.email, code);

  return {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      user_type: user.user_type,
      verified_email: user.verified_email,
    },
    message: 'Usuário criado com sucesso. Verifique seu e-mail para ativar a conta.',
  };
}

export async function verifyEmail(email, code) {
  const knex = getKnex();

  const user = await knex('users')
    .where({ email })
    .where('code_email_verification', code)
    .where('code_expires_at', '>', new Date().toISOString())
    .first();

  if (!user) {
    const err = new Error('Código inválido ou expirado');
    err.statusCode = 400;
    throw err;
  }

  await knex('users')
    .where({ id: user.id })
    .update({
      verified_email: true,
      code_email_verification: null,
      code_expires_at: null,
      updated_at: new Date().toISOString(),
    });

  return { message: 'E-mail verificado com sucesso. Agora você pode fazer login.' };
}

export async function resendVerification(email) {
  const knex = getKnex();

  const user = await knex('users').where({ email }).first();

  if (!user) {
    // Don't reveal if email exists
    return { message: 'Se o e-mail estiver cadastrado, um novo código será enviado.' };
  }

  if (user.verified_email) {
    return { message: 'E-mail já verificado. Você pode fazer login.' };
  }

  const code = generateVerificationCode();
  const codeExpiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000).toISOString();

  await knex('users')
    .where({ id: user.id })
    .update({
      code_email_verification: code,
      code_expires_at: codeExpiresAt,
      updated_at: new Date().toISOString(),
    });

  await sendVerificationEmail(email, code);

  return { message: 'Novo código de verificação enviado.' };
}

export async function loginUser(email, password) {
  const knex = getKnex();

  const user = await knex('users')
    .where({ email })
    .whereNull('deleted_at')
    .first();

  if (!user) {
    const err = new Error('Credenciais inválidas');
    err.statusCode = 401;
    throw err;
  }

  if (!user.verified_email) {
    const err = new Error('E-mail não verificado. Verifique sua caixa de entrada.');
    err.statusCode = 403;
    throw err;
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    const err = new Error('Credenciais inválidas');
    err.statusCode = 401;
    throw err;
  }

  const tokens = createAuthTokens(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      user_type: user.user_type,
      verified_email: user.verified_email,
      avatar_url: user.avatar_url,
      active_notification: user.active_notification,
    },
    ...tokens,
  };
}

export async function forgotPassword(email) {
  const knex = getKnex();

  const user = await knex('users').where({ email }).whereNull('deleted_at').first();

  if (!user) {
    // Don't reveal if email exists
    return { message: 'Se o e-mail estiver cadastrado, um código de recuperação será enviado.' };
  }

  const code = generateVerificationCode();
  const codeExpiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000).toISOString();

  await knex('users')
    .where({ id: user.id })
    .update({
      code_email_verification: code,
      code_expires_at: codeExpiresAt,
      updated_at: new Date().toISOString(),
    });

  await sendPasswordResetEmail(email, code);

  return { message: 'Código de recuperação enviado para o e-mail.' };
}

export async function resetPassword(email, code, password) {
  const knex = getKnex();

  const user = await knex('users')
    .where({ email })
    .where('code_email_verification', code)
    .where('code_expires_at', '>', new Date().toISOString())
    .whereNull('deleted_at')
    .first();

  if (!user) {
    const err = new Error('Código inválido ou expirado');
    err.statusCode = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await knex('users')
    .where({ id: user.id })
    .update({
      password_hash: passwordHash,
      code_email_verification: null,
      code_expires_at: null,
      updated_at: new Date().toISOString(),
    });

  return { message: 'Senha redefinida com sucesso. Agora você pode fazer login.' };
}

export async function getMe(userId) {
  const knex = getKnex();

  const user = await knex('users')
    .where({ id: userId })
    .whereNull('deleted_at')
    .first('id', 'email', 'full_name', 'user_type', 'verified_email', 'avatar_url', 'active_notification', 'phone', 'document_type', 'document_number', 'created_at');

  if (!user) {
    const err = new Error('Usuário não encontrado');
    err.statusCode = 404;
    throw err;
  }

  return { user };
}