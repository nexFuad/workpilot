import { apiRequest } from './auth.server';
import { listQuery } from '@/lib/list-query';
import type { ListParams, PaginationMeta } from '@/types/pagination.types';
export type Advance = {
  id: string;
  amount: number;
  reason: string;
  settlementMonth: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  user: { employeeId: string; fullName: string | null };
};
export const hrAdvancesServer = {
  list: (params: ListParams = {}) =>
    apiRequest<{ requests: Advance[]; pagination: PaginationMeta }>(
      `/api/hr/advances${listQuery(params)}`,
    ),
  review: (id: string, status: 'approved' | 'rejected') =>
    apiRequest(`/api/hr/advances/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};
