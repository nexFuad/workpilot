import { apiRequest } from './auth.server';
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
  list: () => apiRequest<{ requests: Advance[] }>('/api/hr/advances'),
  review: (id: string, status: 'approved' | 'rejected') =>
    apiRequest(`/api/hr/advances/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};
