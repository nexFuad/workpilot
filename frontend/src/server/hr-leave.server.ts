import { apiRequest } from './auth.server';
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
  list: () => apiRequest<{ requests: HrLeave[] }>('/api/hr/leaves'),
  updateStatus: (id: string, status: 'approved' | 'rejected') =>
    apiRequest<{ request: HrLeave }>(`/api/hr/leaves/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};
