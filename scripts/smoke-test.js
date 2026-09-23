import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';

const baseUrl = process.env.API_URL || 'http://localhost:3000';

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
      ...options.headers,
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : options.body,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = await response.text();
  }

  return { status: response.status, data };
}

function expectStatus(result, expected, label) {
  assert.equal(result.status, expected, `${label}: expected ${expected}, got ${result.status}: ${JSON.stringify(result.data)}`);
}

const health = await request('/health');
expectStatus(health, 200, 'health');

const adminLogin = await request('/api/auth/login', {
  method: 'POST',
  body: { email: 'admin@admin.com', password: 'Senha123!' },
});
expectStatus(adminLogin, 200, 'admin login');

const recruiterLogin = await request('/api/auth/login', {
  method: 'POST',
  body: { email: 'recruiter@test.com', password: 'Senha123!' },
});
expectStatus(recruiterLogin, 200, 'recruiter login');

const candidateLogin = await request('/api/auth/login', {
  method: 'POST',
  body: { email: 'candidate@test.com', password: 'Senha123!' },
});
expectStatus(candidateLogin, 200, 'candidate login');

const candidateToken = candidateLogin.data.token;
const recruiterToken = recruiterLogin.data.token;
const adminToken = adminLogin.data.token;
const candidateId = candidateLogin.data.user.id;

const setupDb = new DatabaseSync('./data/conectafacil.db');
setupDb.prepare('DELETE FROM users WHERE email = ?').run('second-recruiter@smoke.test');
const secondPasswordHash = await bcrypt.hash('Senha123!', 12);
setupDb.prepare(`
  INSERT INTO users (
    email, password_hash, full_name, user_type, document_type, document_number,
    verified_email, active_notification, created_at, updated_at
  ) VALUES (?, ?, ?, 'RECRUITER', 'CNPJ', ?, 1, 1, ?, ?)
`).run(
  'second-recruiter@smoke.test',
  secondPasswordHash,
  'Segundo Recrutador Smoke',
  '99887766000100',
  new Date().toISOString(),
  new Date().toISOString(),
);
setupDb.close();

const secondRecruiterLogin = await request('/api/auth/login', {
  method: 'POST',
  body: { email: 'second-recruiter@smoke.test', password: 'Senha123!' },
});
expectStatus(secondRecruiterLogin, 200, 'second recruiter login');
const secondRecruiterToken = secondRecruiterLogin.data.token;

const vacancyUpdate = await request('/api/recruiters/vacancies/2', {
  method: 'PUT',
  token: recruiterToken,
  body: { benefits: 'Vale refeicao atualizado' },
});
expectStatus(vacancyUpdate, 200, 'vacancy update');

const vacancies = await request('/api/candidates/vacancies', { token: candidateToken });
expectStatus(vacancies, 200, 'candidate vacancy list');

const duplicateApplication = await request('/api/candidates/vacancies/2/apply', {
  method: 'POST',
  token: candidateToken,
  body: {},
});
expectStatus(duplicateApplication, 409, 'duplicate application');

const wrongRole = await request('/api/recruiters/profile', { token: candidateToken });
expectStatus(wrongRole, 403, 'wrong role');

const candidateCreatesVacancy = await request('/api/recruiters/vacancies', {
  method: 'POST',
  token: candidateToken,
  body: {},
});
expectStatus(candidateCreatesVacancy, 403, 'candidate creates vacancy');

const recruiterApplies = await request('/api/candidates/vacancies/1/apply', {
  method: 'POST',
  token: recruiterToken,
  body: {},
});
expectStatus(recruiterApplies, 403, 'recruiter applies to vacancy');

const otherRecruiterUpdate = await request('/api/recruiters/vacancies/2', {
  method: 'PUT',
  token: secondRecruiterToken,
  body: { benefits: 'Tentativa indevida' },
});
expectStatus(otherRecruiterUpdate, 403, 'other recruiter vacancy update');

const invalidAvatarBody = new FormData();
invalidAvatarBody.append('avatar', new Blob(['not an image'], { type: 'text/plain' }), 'avatar.txt');
const invalidAvatar = await fetch(`${baseUrl}/api/users/me/avatar`, {
  method: 'POST',
  headers: { authorization: `Bearer ${candidateToken}` },
  body: invalidAvatarBody,
});
assert.equal(invalidAvatar.status, 400, `invalid avatar: expected 400, got ${invalidAvatar.status}`);

const oversizedAvatarBody = new FormData();
oversizedAvatarBody.append('avatar', new Blob([new Uint8Array(3 * 1024 * 1024)], { type: 'image/png' }), 'large.png');
const oversizedAvatar = await fetch(`${baseUrl}/api/users/me/avatar`, {
  method: 'POST',
  headers: { authorization: `Bearer ${candidateToken}` },
  body: oversizedAvatarBody,
});
assert.equal(oversizedAvatar.status, 400, `oversized avatar: expected 400, got ${oversizedAvatar.status}`);

const invalidJwt = await request('/api/auth/me', { token: 'invalid.jwt.token' });
expectStatus(invalidJwt, 401, 'invalid JWT');

const invalidStatus = await request(`/api/recruiters/vacancies/2/candidates/${candidateId}/status`, {
  method: 'PATCH',
  token: recruiterToken,
  body: { status: 'INVALID' },
});
expectStatus(invalidStatus, 400, 'invalid application status');

const invalidCpf = await request('/api/auth/register', {
  method: 'POST',
  body: {
    email: `invalid-cpf-${Date.now()}@test.com`,
    password: 'Senha123!',
    full_name: 'Cadastro Invalido',
    user_type: 'CANDIDATE',
    document_type: 'CPF',
    document_number: '11111111111',
  },
});
expectStatus(invalidCpf, 400, 'invalid CPF');

const recruiterCandidates = await request('/api/recruiters/vacancies/2/candidates', {
  token: recruiterToken,
});
expectStatus(recruiterCandidates, 200, 'recruiter candidate list');
assert.ok(recruiterCandidates.data.candidates.some((candidate) => candidate.candidate_id === candidateId));

const applications = await request('/api/candidates/applications', { token: candidateToken });
expectStatus(applications, 200, 'candidate applications');
assert.ok(applications.data.applications.some((application) => application.vacancy_id === 2));

const forgot = await request('/api/auth/forgot-password', {
  method: 'POST',
  body: { email: 'candidate@test.com' },
});
expectStatus(forgot, 200, 'forgot password');

const db = new DatabaseSync('./data/conectafacil.db');
const resetCode = db.prepare('SELECT code_email_verification FROM users WHERE email = ?').get('candidate@test.com').code_email_verification;
db.close();

const reset = await request('/api/auth/reset-password', {
  method: 'POST',
  body: { email: 'candidate@test.com', code: resetCode, password: 'Senha123!' },
});
expectStatus(reset, 200, 'reset password');

const linkedUserDelete = await request('/api/admin/users/6', {
  method: 'DELETE',
  token: adminToken,
});
expectStatus(linkedUserDelete, 409, 'linked user delete');

const cleanupDb = new DatabaseSync('./data/conectafacil.db');
cleanupDb.prepare('DELETE FROM users WHERE email = ?').run('second-recruiter@smoke.test');
cleanupDb.close();

console.log('Smoke tests passed.');