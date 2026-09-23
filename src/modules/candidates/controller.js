import * as candidateService from './service.js';

export async function getProfile(req, res) {
  const result = await candidateService.getProfile(req.user.id);
  res.json(result);
}

export async function updateProfile(req, res) {
  const result = await candidateService.updateProfile(req.user.id, req.validated.body);
  res.json(result);
}

export async function listVacancies(req, res) {
  const result = await candidateService.listVacancies(req.user.id, req.validated.query);
  res.json(result);
}

export async function getVacancy(req, res) {
  const { id } = req.params;
  const result = await candidateService.getVacancy(req.user.id, Number(id));
  res.json(result);
}

export async function applyToVacancy(req, res) {
  const { id } = req.params;
  const result = await candidateService.applyToVacancy(req.user.id, Number(id));
  res.status(201).json(result);
}

export async function listApplications(req, res) {
  const result = await candidateService.listApplications(req.user.id);
  res.json(result);
}

export async function deleteApplication(req, res) {
  const { vacancyId } = req.params;
  const result = await candidateService.deleteApplication(req.user.id, Number(vacancyId));
  res.json(result);
}

export async function toggleNotification(req, res) {
  const { active_notification } = req.validated.body;
  const result = await candidateService.toggleNotification(req.user.id, active_notification);
  res.json(result);
}