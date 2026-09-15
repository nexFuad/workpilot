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
  salary: (month = '') =>
    apiRequest<{
      payments: SalaryPayment[];
      advances: SalaryAdvance[];
      loans: Loan[];
      selectedPayment: SalaryPayment | null;
      approvedAdvanceAmount: number;
      activeLoanInstallment: number;
    }>(`/api/compensation/salary${month ? `?month=${encodeURIComponent(month)}` : ''}`),
  createAdvance: (data: AdvanceInput) =>
    apiRequest<{ advance: SalaryAdvance }>('/api/compensation/salary/advances', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  loans: () =>
    apiRequest<{ requests: LoanRequest[]; loans: Loan[]; activeLoan: Loan | null }>(
      '/api/compensation/loans',
    ),
  createLoan: (data: LoanInput) =>
    apiRequest<{ request: LoanRequest }>('/api/compensation/loans', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
