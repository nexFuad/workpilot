import { apiRequest } from './auth.server';
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
  list: () => apiRequest<{ documents: HrDocument[] }>('/api/documents/review'),
  review: (id: string, status: 'approved' | 'rejected', reviewerNote: string) =>
    apiRequest(`/api/documents/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reviewerNote }),
    }),
};
