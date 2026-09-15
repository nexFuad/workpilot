import { apiRequest } from '@/server/auth.server';
import type { HrTask, HrTaskInput, HrTasksResponse } from '@/types/hr-task.types';
import { listQuery } from '@/lib/list-query';
import type { ListParams } from '@/types/pagination.types';

export const hrTasksServer = {
  list: (params: ListParams = {}) =>
    apiRequest<HrTasksResponse>(`/api/hr/tasks${listQuery(params)}`),
  create: (input: HrTaskInput) =>
    apiRequest<{ task: HrTask }>('/api/hr/tasks', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  update: (id: string, input: HrTaskInput) =>
    apiRequest<{ task: HrTask }>(`/api/hr/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  remove: (id: string) =>
    apiRequest<{ message: string }>(`/api/hr/tasks/${id}`, { method: 'DELETE' }),
};
