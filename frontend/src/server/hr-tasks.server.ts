import { apiRequest } from '@/server/auth.server';
import type { HrTask, HrTaskInput, HrTasksResponse } from '@/types/hr-task.types';

export const hrTasksServer = {
  list: () => apiRequest<HrTasksResponse>('/api/hr/tasks'),
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
