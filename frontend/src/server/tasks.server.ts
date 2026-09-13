import { apiRequest } from './auth.server';
import type { EmployeeTask, TaskStatus } from '@/types/task.types';

export const tasksServer = {
  list: () => apiRequest<{ tasks: EmployeeTask[] }>('/api/tasks'),
  updateStatus: (id: string, status: TaskStatus) =>
    apiRequest<{ task: EmployeeTask }>(`/api/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};
