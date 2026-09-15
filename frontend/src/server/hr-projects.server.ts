import { apiRequest } from '@/server/auth.server';
import type { HrProject, HrProjectInput, HrProjectsResponse } from '@/types/hr-project.types';
import { listQuery } from '@/lib/list-query';
import type { ListParams } from '@/types/pagination.types';

export const hrProjectsServer = {
  list: (params: ListParams = {}) =>
    apiRequest<HrProjectsResponse>(`/api/hr/projects${listQuery(params)}`),
  create: (input: HrProjectInput) =>
    apiRequest<{ project: HrProject }>('/api/hr/projects', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  update: (id: string, input: HrProjectInput) =>
    apiRequest<{ project: HrProject }>(`/api/hr/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  remove: (id: string) =>
    apiRequest<{ message: string }>(`/api/hr/projects/${id}`, { method: 'DELETE' }),
};
