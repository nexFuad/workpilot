import { apiRequest } from './auth.server';
import type {
  AdvanceInput,
  Loan,
  LoanInput,
  LoanRequest,
  SalaryAdvance,
  SalaryPayment,
} from '@/types/compensation.types';

export const compensationServer = {
  salary: () =>
    apiRequest<{ payments: SalaryPayment[]; advances: SalaryAdvance[]; loans: Loan[] }>(
      '/api/compensation/salary',
    ),
  createAdvance: (data: AdvanceInput) =>
    apiRequest<{ advance: SalaryAdvance }>('/api/compensation/salary/advances', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  loans: () => apiRequest<{ requests: LoanRequest[]; loans: Loan[] }>('/api/compensation/loans'),
  createLoan: (data: LoanInput) =>
    apiRequest<{ request: LoanRequest }>('/api/compensation/loans', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
