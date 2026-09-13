import { apiRequest } from './auth.server';
import type { EmployeeProject } from '@/types/project.types';
export const projectsServer = {
  list: () => apiRequest<{ projects: EmployeeProject[] }>('/api/projects'),
};
