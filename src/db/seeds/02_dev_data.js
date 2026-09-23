import bcrypt from 'bcryptjs';

export async function seed(knex) {
  // Only run in development
  if (process.env.NODE_ENV === 'production') {
    console.log('⏭️ Skipping dev seed in production');
    return;
  }

  const passwordHash = await bcrypt.hash('Senha123!', 12);

  const devUsers = await knex('users')
    .whereIn('email', ['recruiter@test.com', 'candidate@test.com'])
    .select('id');
  const devUserIds = devUsers.map(({ id }) => id);

  if (devUserIds.length > 0) {
    await knex('interests').whereIn('user_id', devUserIds).delete();
    await knex('vacancies').whereIn('user_id', devUserIds).delete();
    await knex('users').whereIn('id', devUserIds).delete();
  }

  // Recruiter with valid CNPJ: 11.222.333/0001-81
  const [{ id: recruiterId }] = await knex('users').insert({
    email: 'recruiter@test.com',
    password_hash: passwordHash,
    full_name: 'Recrutador Teste',
    user_type: 'RECRUITER',
    document_type: 'CNPJ',
    document_number: '11222333000181',
    phone: '(11) 99999-9999',
    avatar_url: null,
    verified_email: true,
    code_email_verification: null,
    code_expires_at: null,
    active_notification: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  }).returning('id');

  // Candidate with valid CPF: 529.982.247-25
  const [{ id: candidateId }] = await knex('users').insert({
    email: 'candidate@test.com',
    password_hash: passwordHash,
    full_name: 'Candidato Teste',
    user_type: 'CANDIDATE',
    document_type: 'CPF',
    document_number: '52998224725',
    phone: '(11) 88888-8888',
    avatar_url: null,
    verified_email: true,
    code_email_verification: null,
    code_expires_at: null,
    active_notification: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  }).returning('id');

  // Create sample vacancies
  const [{ id: vacancy1Id }] = await knex('vacancies').insert({
    user_id: recruiterId,
    job_title: 'Desenvolvedor Full Stack',
    company_name: 'TechCorp',
    company_sector: 'Tecnologia',
    job_description: 'Buscamos desenvolvedor Full Stack com experiência em Node.js, React e PostgreSQL.',
    requirements: 'Node.js, React, PostgreSQL, Docker, Git',
    benefits: 'Vale refeição, plano de saúde, home office',
    location: 'São Paulo - SP',
    work_model: 'HYBRID',
    contract_type: 'CLT',
    salary_min: 8000.00,
    salary_max: 12000.00,
    status: 'OPEN',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  }).returning('id');

  const [{ id: vacancy2Id }] = await knex('vacancies').insert({
    user_id: recruiterId,
    job_title: 'Desenvolvedor Frontend',
    company_name: 'StartupXYZ',
    company_sector: 'Tecnologia',
    job_description: 'Vaga para desenvolvedor Frontend com foco em React e TypeScript.',
    requirements: 'React, TypeScript, Next.js, Tailwind CSS',
    benefits: 'Horário flexível, equipamentos, cursos',
    location: 'Remoto',
    work_model: 'REMOTE',
    contract_type: 'PJ',
    salary_min: 6000.00,
    salary_max: 10000.00,
    status: 'OPEN',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  }).returning('id');

  // Create a sample application (interest)
  await knex('interests').insert({
    user_id: candidateId,
    vacancy_id: vacancy1Id,
    status: 'PENDING',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  console.log('✅ Dev data seeded:');
  console.log('   - Recruiter: recruiter@test.com / Senha123!');
  console.log('   - Candidate: candidate@test.com / Senha123!');
  console.log(`   - Vacancies: ${vacancy1Id}, ${vacancy2Id}`);
  console.log('   - Application: candidate -> vacancy1 (PENDING)');
}