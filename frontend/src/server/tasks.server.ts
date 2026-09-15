import { apiRequest } from './auth.server';
import type { EmployeeTask, TaskStatus } from '@/types/task.types';
import { listQuery } from '@/lib/list-query';
import type { ListParams, PaginationMeta } from '@/types/pagination.types';

export const tasksServer = {
  list: (params: ListParams = {}) =>
    apiRequest<{
      tasks: EmployeeTask[];
      pagination: PaginationMeta;
      summary: { total: number; open: number; inProgress: number; completed: number };
    }>(`/api/tasks${listQuery(params)}`),
  updateStatus: (id: string, status: TaskStatus) =>
    apiRequest<{ task: EmployeeTask }>(`/api/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};
