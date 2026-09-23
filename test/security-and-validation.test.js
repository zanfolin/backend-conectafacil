import assert from 'node:assert/strict';
import test from 'node:test';
import { z } from 'zod';
import { requireRole } from '../src/middlewares/requireRole.js';
import { validate } from '../src/middlewares/validate.js';
import { registerSchema, resetPasswordSchema } from '../src/modules/auth/schemas.js';

function responseRecorder() {
  const response = {
    statusCode: null,
    payload: null,
    status(code) {
      response.statusCode = code;
      return response;
    },
    json(payload) {
      response.payload = payload;
      return response;
    },
  };
  return response;
}

test('requireRole rejects missing authentication', () => {
  const response = responseRecorder();
  let nextCalled = false;

  requireRole('ADMIN')({}, response, () => {
    nextCalled = true;
  });

  assert.equal(response.statusCode, 401);
  assert.equal(nextCalled, false);
});

test('requireRole rejects a user with the wrong role', () => {
  const response = responseRecorder();
  let nextCalled = false;

  requireRole('ADMIN')({ user: { type: 'CANDIDATE' } }, response, () => {
    nextCalled = true;
  });

  assert.equal(response.statusCode, 403);
  assert.equal(nextCalled, false);
});

test('requireRole allows an authorized role', () => {
  const response = responseRecorder();
  let nextCalled = false;

  requireRole('RECRUITER')({ user: { type: 'RECRUITER' } }, response, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(response.statusCode, null);
});

test('validate returns structured validation errors', () => {
  const response = responseRecorder();
  const schema = z.object({ body: z.object({ email: z.string().email() }) });

  validate(schema)({ body: { email: 'invalid' }, query: {}, params: {} }, response, () => {
    assert.fail('next should not be called for invalid input');
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.payload.error, 'Validation Error');
  assert.equal(response.payload.details[0].field, 'body.email');
});

test('registration schema accepts a valid candidate CPF', () => {
  const parsed = registerSchema.parse({
    body: {
      email: 'candidate@example.com',
      password: 'Senha123!',
      full_name: 'Candidato Teste',
      user_type: 'CANDIDATE',
      document_type: 'CPF',
      document_number: '52998224725',
    },
  });

  assert.equal(parsed.body.user_type, 'CANDIDATE');
});

test('registration schema rejects CNPJ for a candidate', () => {
  assert.throws(() => registerSchema.parse({
    body: {
      email: 'candidate@example.com',
      password: 'Senha123!',
      full_name: 'Candidato Teste',
      user_type: 'CANDIDATE',
      document_type: 'CNPJ',
      document_number: '11222333000181',
    },
  }));
});

test('reset password schema requires a six-digit code and a strong password length', () => {
  assert.throws(() => resetPasswordSchema.parse({
    body: {
      email: 'candidate@example.com',
      code: '123',
      password: 'short',
    },
  }));

  const parsed = resetPasswordSchema.parse({
    body: {
      email: 'candidate@example.com',
      code: '123456',
      password: 'Senha123!',
    },
  });

  assert.equal(parsed.body.code, '123456');
});

test('JWT signs and verifies a token with the configured secret', async () => {
  process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters';
  process.env.NODE_ENV = 'test';
  process.env.SMTP_HOST = '';
  process.env.SMTP_USER = '';
  process.env.SMTP_PASS = '';

  const { createAuthTokens, verifyToken } = await import('../src/utils/jwt.js');
  const { token } = createAuthTokens({ id: 42, user_type: 'CANDIDATE' });
  const payload = verifyToken(token);

  assert.equal(payload.sub, 42);
  assert.equal(payload.type, 'CANDIDATE');
});
