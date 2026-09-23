import * as adminService from './service.js';

export async function listUsers(req, res) {
  const result = await adminService.listUsers(req.validated.query);
  res.json(result);
}

export async function getUser(req, res) {
  const { id } = req.params;
  const result = await adminService.getUser(Number(id));
  res.json(result);
}

export async function updateUser(req, res) {
  const { id } = req.params;
  const result = await adminService.updateUser(Number(id), req.validated.body);
  res.json(result);
}

export async function deleteUser(req, res) {
  const { id } = req.params;
  const result = await adminService.deleteUser(Number(id));
  res.json(result);
}

export async function listVacancies(req, res) {
  const result = await adminService.listVacancies(req.validated.query);
  res.json(result);
}

export async function getVacancy(req, res) {
  const { id } = req.params;
  const result = await adminService.getVacancy(Number(id));
  res.json(result);
}

export async function updateVacancy(req, res) {
  const { id } = req.params;
  const result = await adminService.updateVacancy(Number(id), req.validated.body);
  res.json(result);
}

export async function deleteVacancy(req, res) {
  const { id } = req.params;
  const result = await adminService.deleteVacancy(Number(id));
  res.json(result);
}