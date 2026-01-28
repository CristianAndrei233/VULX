import axios from 'axios';
import type { Project, Scan, User } from '../types';

const api = axios.create({
  baseURL: '/api', // Use relative path to leverage Vite proxy
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  const env = localStorage.getItem('vulx_environment') || 'PRODUCTION';
  config.headers['X-VULX-ENVIRONMENT'] = env;
  
  return config;
});

// No changes needed for method bodies as they use relative paths like '/projects'
// which will now map to '/api/projects' correctly.
export const getProjects = async () => {
  const response = await api.get<Project[]>('/projects');
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

export const getApiKeys = async (projectId: string) => {
  const response = await api.get<any[]>(`/projects/${projectId}/keys`);
  return response.data;
};

export const generateApiKey = async (projectId: string, environment: 'SANDBOX' | 'PRODUCTION') => {
  const response = await api.post<any>(`/projects/${projectId}/keys`, { environment });
  return response.data;
};

export const deleteApiKey = async (projectId: string, keyId: string) => {
  await api.delete(`/projects/${projectId}/keys/${keyId}`);
};

export const updateProfile = async (data: { name?: string; email?: string }) => {
    const response = await api.put<User>('/auth/me', data);
    return response.data;
};

export const changePassword = async (data: { currentPassword: string; newPassword: string }) => {
    const response = await api.put<{ success: true; message: string }>('/auth/password', data);
    return response.data;
};

export const deleteAccount = async () => {
    const response = await api.delete<{ success: true; message: string }>('/auth/me');
    return response.data;
};

export default api;
