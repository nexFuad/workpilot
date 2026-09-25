export type SalaryRecord = {
  month: string;
  period: string;
  paidOn: string | null;
  basic: number;
  allowances: number;
  bonus: number;
  tax: number;
  providentFund: number;
  status: string;
};

export type AdvanceRequest = {
  id: string;
  amount: number;
  reason: string;
  requestedOn: string;
  settlementMonth: string;
  status: 'Pending' | 'Approved' | 'Rejected';
};

export type SalaryPayment = {
  id: string;
  month: string;
  period: string;
  paidOn: string | null;
  basic: number;
  allowances: number;
  bonus: number;
  tax: number;
  providentFund: number;
  status: string;
  createdAt: string;
};
export type SalaryAdvance = {
  id: string;
  amount: number;
  reason: string;
  settlementMonth: string;
  status: string;
  createdAt: string;
};
export type LoanRequest = {
  id: string;
  amount: number;
  purpose: string;
  tenure: number;
  status: string;
  createdAt: string;
};
export type Loan = {
  id: string;
  principal: number;
  outstanding: number;
  installment: number;
  tenure: number;
  paidInstallments: number;
  nextDue: string;
  status: string;
};
export type AdvanceInput = { amount: number; reason: string; settlementMonth: string };
export type LoanInput = { amount: number; purpose: string; tenure: number };
