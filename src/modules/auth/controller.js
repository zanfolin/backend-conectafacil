import * as authService from './service.js';

export async function register(req, res) {
  const result = await authService.registerUser(req.validated.body);
  res.status(201).json(result);
}

export async function verifyEmail(req, res) {
  const { email, code } = req.validated.body;
  const result = await authService.verifyEmail(email, code);
  res.json(result);
}

export async function resendVerification(req, res) {
  const { email } = req.validated.body;
  const result = await authService.resendVerification(email);
  res.json(result);
}

export async function login(req, res) {
  const { email, password } = req.validated.body;
  const result = await authService.loginUser(email, password);
  res.json(result);
}

export async function forgotPassword(req, res) {
  const { email } = req.validated.body;
  const result = await authService.forgotPassword(email);
  res.json(result);
}

export async function resetPassword(req, res) {
  const { email, code, password } = req.validated.body;
  const result = await authService.resetPassword(email, code, password);
  res.json(result);
}

export async function me(req, res) {
  const result = await authService.getMe(req.user.id);
  res.json(result);
}