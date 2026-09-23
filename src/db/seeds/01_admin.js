import bcrypt from 'bcryptjs';

export async function seed(knex) {
  // Delete existing admin
  await knex('users').where({ email: 'admin@admin.com' }).delete();

  const passwordHash = await bcrypt.hash('Senha123!', 12);

  // Valid CPF placeholder: 111.444.777-35 (valid check digits)
  await knex('users').insert({
    email: 'admin@admin.com',
    password_hash: passwordHash,
    full_name: 'Administrador',
    user_type: 'ADMIN',
    document_type: 'CPF',
    document_number: '11144477735',
    phone: null,
    avatar_url: null,
    verified_email: true,
    code_email_verification: null,
    code_expires_at: null,
    active_notification: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  });

  console.log('✅ Admin user seeded: admin@admin.com / Senha123!');
}