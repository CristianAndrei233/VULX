import axios from 'axios';
import type { Project, Scan } from '../types';

const api = axios.create({
  baseURL: 'http://localhost:3001',
});

export const getProjects = async () => {
  const response = await api.get<Project[]>('/projects'); // Assuming backend list endpoint exists or we use org
  // Correction: We don't have a list-all endpoint yet, only get-by-id.
  // We should add one, or use a hardcoded list for now?
  // Let's implement getting a specific project for now or mock the list.
  // Actually, I'll add a list endpoint to the backend quickly in the next step.
  return response.data;
};

export const getProject = async (id: string) => {
  const response = await api.get<Project>(`/projects/${id}`);
  return response.data;
};

export const createProject = async (data: Partial<Project>) => {
  const response = await api.post<Project>('/projects', data);
  return response.data;
};

export const triggerScan = async (projectId: string) => {
  const response = await api.post<Scan>(`/projects/${projectId}/scans`);
  return response.data;
};

export const updateProject = async (id: string, data: Partial<Project>) => {
  const response = await api.put<Project>(`/projects/${id}`, data);
  return response.data;
};

export const deleteProject = async (id: string) => {
  await api.delete(`/projects/${id}`);
};

export default api;
