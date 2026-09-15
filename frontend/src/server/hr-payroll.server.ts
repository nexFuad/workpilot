import { apiRequest } from './auth.server';
import { listQuery } from '@/lib/list-query';
import type { ListParams, PaginationMeta } from '@/types/pagination.types';
export type Payroll = {
  id: string;
  userId: string;
  month: string;
  period: string;
  basic: number;
  allowances: number;
  bonus: number;
  tax: number;
  providentFund: number;
  status: string;
  paidOn: string | null;
  user: { employeeId: string; fullName: string | null; role: 'employee' | 'hr' };
};
export type PayrollInput = {
  userId: string;
  month: string;
  period: string;
  basic: number;
  allowances: number;
  bonus: number;
  tax: number;
  providentFund: number;
  status: 'upcoming' | 'paid';
  paidOn?: string;
};
export const hrPayrollServer = {
  list: (params: ListParams = {}) =>
    apiRequest<{
      payments: Payroll[];
      employees: {
        id: string;
        employeeId: string;
        fullName: string | null;
        role: 'employee' | 'hr';
      }[];
      months: string[];
      pagination: PaginationMeta;
    }>(`/api/hr/payroll${listQuery(params)}`),
  save: (data: PayrollInput) =>
    apiRequest('/api/hr/payroll', { method: 'POST', body: JSON.stringify(data) }),
  generate: () =>
    apiRequest<{ month: string; generated: number }>('/api/hr/payroll/generate', {
      method: 'POST',
    }),
  updateStatus: (id: string, status: 'upcoming' | 'paid') =>
    apiRequest<{ payment: Payroll }>(`/api/hr/payroll/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};
