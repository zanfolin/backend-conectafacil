import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signToken(payload, options = {}) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    ...options,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

export function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function createAuthTokens(user) {
  const payload = {
    sub: user.id,
    type: user.user_type,
  };
  const token = signToken(payload);
  return { token };
}