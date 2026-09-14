import { apiRequest } from './auth.server';
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
  user: { employeeId: string; fullName: string | null };
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
  list: () =>
    apiRequest<{
      payments: Payroll[];
      employees: { id: string; employeeId: string; fullName: string | null }[];
    }>('/api/hr/payroll'),
  save: (data: PayrollInput) =>
    apiRequest('/api/hr/payroll', { method: 'POST', body: JSON.stringify(data) }),
  generate: () =>
    apiRequest<{ month: string; generated: number }>('/api/hr/payroll/generate', {
      method: 'POST',
    }),
};
