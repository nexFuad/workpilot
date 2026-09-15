import { apiRequest } from './auth.server';
import type { EmployeeDocument } from '@/types/document.types';
export const documentsServer = {
  list: (search = '') => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiRequest<{ documents: EmployeeDocument[] }>(`/api/documents${query}`);
  },
  create: (data: Omit<EmployeeDocument, 'id' | 'status' | 'reviewerNote' | 'createdAt'>) =>
    apiRequest<{ document: EmployeeDocument }>('/api/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
