import { apiRequest } from './auth.server';
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
  list: () => apiRequest<{ requests: HrLoan[] }>('/api/hr/loans'),
  review: (id: string, status: 'approved' | 'rejected') =>
    apiRequest(`/api/hr/loans/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};
