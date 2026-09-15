import { apiRequest } from './auth.server';
import type { LeaveRequest, LeaveRequestInput } from '@/types/leave.types';
import type { PaginationMeta } from '@/types/pagination.types';

export const leaveServer = {
  list: (search = '') =>
    apiRequest<{ requests: LeaveRequest[]; pagination: PaginationMeta }>(
      `/api/leaves?search=${encodeURIComponent(search)}&limit=50`,
    ),
  create: (data: LeaveRequestInput) =>
    apiRequest<{ request: LeaveRequest }>('/api/leaves', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: LeaveRequestInput) =>
    apiRequest<{ request: LeaveRequest }>(`/api/leaves/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    apiRequest<{ message: string }>(`/api/leaves/${id}`, { method: 'DELETE' }),
};
