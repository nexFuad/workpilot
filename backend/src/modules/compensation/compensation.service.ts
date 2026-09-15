import { ApiError } from '../../lib/api-error.js';
import { prisma } from '../../lib/prisma.js';
import type { z } from 'zod';
import { advanceRequestSchema, loanRequestSchema, reviewSchema } from './compensation.schema.js';

type AdvanceInput = z.infer<typeof advanceRequestSchema>;
type LoanInput = z.infer<typeof loanRequestSchema>;
type ReviewInput = z.infer<typeof reviewSchema>;

export async function getSalary(userId: string, requestedMonth?: string) {
  const [payments, advances, loans] = await Promise.all([
    prisma.salaryPayment.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.salaryAdvanceRequest.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.loan.findMany({ where: { userId, status: 'active' } }),
  ]);
  const selectedPayment = requestedMonth
    ? (payments.find((payment) => payment.month === requestedMonth) ?? null)
    : (payments[0] ?? null);
  const approvedAdvanceAmount = selectedPayment
    ? advances
        .filter(
          (advance) =>
            advance.status === 'approved' && advance.settlementMonth === selectedPayment.month,
        )
        .reduce((total, advance) => total + advance.amount, 0)
    : 0;
  return {
    payments,
    advances,
    loans,
    selectedPayment,
    approvedAdvanceAmount,
    activeLoanInstallment: loans.reduce((total, loan) => total + loan.installment, 0),
  };
}

export async function createAdvanceRequest(userId: string, input: AdvanceInput) {
  const payment = await prisma.salaryPayment.findFirst({
    where: { userId, month: input.settlementMonth },
  });
  if (!payment) {
    throw new ApiError(400, 'No salary record exists for the selected month.');
  }
  const netSalary =
    payment.basic + payment.allowances + payment.bonus - payment.tax - payment.providentFund;
  if (input.amount > netSalary) {
    throw new ApiError(400, 'Advance cannot exceed your net salary.');
  }
  return prisma.salaryAdvanceRequest.create({ data: { ...input, userId } });
}

export async function getLoans(userId: string) {
  const [requests, loans] = await Promise.all([
    prisma.loanRequest.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.loan.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
  ]);
  return { requests, loans, activeLoan: loans.find((loan) => loan.status === 'active') ?? null };
}

export function createLoanRequest(userId: string, input: LoanInput) {
  return prisma.loanRequest.create({ data: { ...input, userId } });
}

export async function reviewAdvanceRequest(id: string, input: ReviewInput) {
  const existing = await prisma.salaryAdvanceRequest.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) throw new ApiError(404, 'Advance request not found.');
  return prisma.salaryAdvanceRequest.update({
    where: { id },
    data: { status: input.status, reviewedAt: new Date() },
  });
}

export async function reviewLoanRequest(id: string, input: ReviewInput) {
  const existing = await prisma.loanRequest.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new ApiError(404, 'Loan request not found.');
  return prisma.$transaction(async (transaction) => {
    const request = await transaction.loanRequest.update({
      where: { id },
      data: { status: input.status, reviewedAt: new Date() },
    });
    if (input.status === 'approved') {
      await transaction.loan.upsert({
        where: { requestId: request.id },
        update: {},
        create: {
          userId: request.userId,
          requestId: request.id,
          principal: request.amount,
          outstanding: request.amount,
          installment: Math.ceil(request.amount / request.tenure),
          tenure: request.tenure,
          nextDue: new Date(),
        },
      });
    } else {
      await transaction.loan.deleteMany({ where: { requestId: request.id } });
    }
    return request;
  });
}
