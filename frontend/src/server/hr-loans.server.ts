import { apiRequest } from './auth.server';
import { listQuery } from '@/lib/list-query';
import type { ListParams, PaginationMeta } from '@/types/pagination.types';
export type HrLoan = {
  id: string;
  amount: number;
  purpose: string;
  tenure: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  user: { employeeId: string; fullName: string | null };
};
export const hrLoansServer = {
  list: (params: ListParams = {}) =>
    apiRequest<{ requests: HrLoan[]; pagination: PaginationMeta }>(
      `/api/hr/loans${listQuery(params)}`,
    ),
  review: (id: string, status: 'approved' | 'rejected') =>
    apiRequest(`/api/hr/loans/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};
