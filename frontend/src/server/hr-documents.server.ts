import { apiRequest } from './auth.server';
import { listQuery } from '@/lib/list-query';
import type { ListParams, PaginationMeta } from '@/types/pagination.types';
export type HrDocument = {
  id: string;
  name: string;
  fileUrl: string;
  fileType: string;
  size: number;
  status: 'pending' | 'approved' | 'rejected';
  reviewerNote: string | null;
  createdAt: string;
  user: { employeeId: string; fullName: string | null };
};
export const hrDocumentsServer = {
  list: (params: ListParams = {}) =>
    apiRequest<{ documents: HrDocument[]; pagination: PaginationMeta }>(
      `/api/documents/review${listQuery(params)}`,
    ),
  review: (id: string, status: 'approved' | 'rejected', reviewerNote: string) =>
    apiRequest(`/api/documents/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reviewerNote }),
    }),
  remove: (id: string) => apiRequest(`/api/documents/${id}`, { method: 'DELETE' }),
};
