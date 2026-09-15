import { apiRequest } from './auth.server';
import type { EmployeeProject } from '@/types/project.types';
import { listQuery } from '@/lib/list-query';
import type { ListParams, PaginationMeta } from '@/types/pagination.types';
export const projectsServer = {
  list: (params: ListParams = {}) =>
    apiRequest<{
      projects: EmployeeProject[];
      pagination: PaginationMeta;
      summary: { total: number; active: number; averageProgress: number; roles: number };
    }>(`/api/projects${listQuery(params)}`),
};
