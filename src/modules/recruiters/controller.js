import * as recruiterService from './service.js';

export async function getProfile(req, res) {
  const result = await recruiterService.getProfile(req.user.id);
  res.json(result);
}

export async function updateProfile(req, res) {
  const result = await recruiterService.updateProfile(req.user.id, req.validated.body);
  res.json(result);
}

export async function createVacancy(req, res) {
  const result = await recruiterService.createVacancy(req.user.id, req.validated.body);
  res.status(201).json(result);
}

export async function listMyVacancies(req, res) {
  const result = await recruiterService.listMyVacancies(req.user.id, req.validated.query);
  res.json(result);
}

export async function getMyVacancy(req, res) {
  const { id } = req.params;
  const result = await recruiterService.getMyVacancy(req.user.id, Number(id));
  res.json(result);
}

export async function updateVacancy(req, res) {
  const { id } = req.params;
  const result = await recruiterService.updateVacancy(req.user.id, Number(id), req.validated.body);
  res.json(result);
}

export async function deleteVacancy(req, res) {
  const { id } = req.params;
  const result = await recruiterService.deleteVacancy(req.user.id, Number(id));
  res.json(result);
}

export async function listCandidatesForVacancy(req, res) {
  const { id } = req.params;
  const result = await recruiterService.listCandidatesForVacancy(req.user.id, Number(id), req.validated.query);
  res.json(result);
}

export async function updateCandidateStatus(req, res) {
  const { id, userId } = req.params;
  const { status } = req.validated.body;
  const result = await recruiterService.updateCandidateStatus(req.user.id, Number(id), Number(userId), status);
  res.json(result);
}

export async function getCandidateProfile(req, res) {
  const { id } = req.params;
  const result = await recruiterService.getCandidateProfile(req.user.id, Number(id));
  res.json(result);
}