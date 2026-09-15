import { apiRequest } from './auth.server';
import { listQuery } from '@/lib/list-query';
import type { ListParams, PaginationMeta } from '@/types/pagination.types';
export type HrLeave = {
  id: string;
  leaveType: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  user: { employeeId: string; fullName: string | null; companyName: string };
};
export const hrLeaveServer = {
  list: (params: ListParams = {}) =>
    apiRequest<{ requests: HrLeave[]; pagination: PaginationMeta }>(
      `/api/hr/leaves${listQuery(params)}`,
    ),
  updateStatus: (id: string, status: 'approved' | 'rejected') =>
    apiRequest<{ request: HrLeave }>(`/api/hr/leaves/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};
