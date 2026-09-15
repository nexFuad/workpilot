import type { Prisma } from '@prisma/client';
import type { z } from 'zod';
import { ApiError } from '../../lib/api-error.js';
import { monthLabel, previousMonth, utcDayRange } from '../../lib/date.js';
import { pagination, type ListQuery } from '../../lib/list-query.js';
import { prisma } from '../../lib/prisma.js';
import { payrollSchema, payrollStatusSchema } from './hr-payroll.schema.js';

type PayrollInput = z.infer<typeof payrollSchema>;
type PayrollStatusInput = z.infer<typeof payrollStatusSchema>;

const payrollMonths = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

function allowedPayrollMonth(value?: string) {
  if (!value) return null;
  const match = value
    .trim()
    .toLowerCase()
    .match(/^([a-z]+)\s+(\d{4})$/);
  if (!match) return null;
  const month = payrollMonths.indexOf(match[1]);
  if (month < 0) return null;
  const selected = new Date(Number(match[2]), month, 1);
  return selected.getTime() <= previousMonth().getTime() ? monthLabel(selected) : null;
}

export async function listPayroll(query: ListQuery, requestedMonth?: string) {
  const status = ['upcoming', 'paid'].includes(query.status ?? '') ? query.status : undefined;
  const month = allowedPayrollMonth(requestedMonth) ?? monthLabel(previousMonth());
  const numericValue = query.search.replace(/[$,\s]/g, '');
  const amount = /^\d+$/.test(numericValue) ? Number(numericValue) : null;
  const dateRange = utcDayRange(query.search);
  const where: Prisma.SalaryPaymentWhereInput = {
    user: { is: { isActive: true, role: { in: ['employee', 'hr'] } } },
    ...(status ? { status } : {}),
    month,
    ...(query.search
      ? {
          OR: [
            { month: { contains: query.search, mode: 'insensitive' } },
            { period: { contains: query.search, mode: 'insensitive' } },
            { status: { contains: query.search, mode: 'insensitive' } },
            {
              user: {
                is: {
                  OR: [
                    { employeeId: { contains: query.search, mode: 'insensitive' } },
                    { fullName: { contains: query.search, mode: 'insensitive' } },
                    { email: { contains: query.search, mode: 'insensitive' } },
                    { phone: { contains: query.search, mode: 'insensitive' } },
                    { companyName: { contains: query.search, mode: 'insensitive' } },
                    { department: { contains: query.search, mode: 'insensitive' } },
                    { designation: { contains: query.search, mode: 'insensitive' } },
                    { role: { contains: query.search, mode: 'insensitive' } },
                    { address: { contains: query.search, mode: 'insensitive' } },
                    { gender: { contains: query.search, mode: 'insensitive' } },
                    { employmentType: { contains: query.search, mode: 'insensitive' } },
                    { employmentStatus: { contains: query.search, mode: 'insensitive' } },
                    { salaryType: { contains: query.search, mode: 'insensitive' } },
                  ],
                },
              },
            },
            ...(amount === null
              ? []
              : [
                  { basic: amount },
                  { allowances: amount },
                  { bonus: amount },
                  { tax: amount },
                  { providentFund: amount },
                ]),
            ...(dateRange ? [{ paidOn: dateRange }, { createdAt: dateRange }] : []),
          ],
        }
      : {}),
  };
  const [payments, total, employees, months] = await Promise.all([
    prisma.salaryPayment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: query.skip,
      take: query.limit,
      include: { user: { select: { employeeId: true, fullName: true, role: true } } },
    }),
    prisma.salaryPayment.count({ where }),
    prisma.user.findMany({
      where: { role: { in: ['employee', 'hr'] }, isActive: true },
      orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
      select: { id: true, employeeId: true, fullName: true, role: true },
    }),
    prisma.salaryPayment.findMany({
      distinct: ['month'],
      orderBy: { createdAt: 'desc' },
      select: { month: true },
    }),
  ]);
  return {
    payments,
    employees,
    months: months.map((item) => item.month),
    pagination: pagination(total, query.page, query.limit),
  };
}

export async function generatePreviousPayroll() {
  const payrollDate = previousMonth();
  const month = monthLabel(payrollDate);
  const lastDay = new Date(payrollDate.getFullYear(), payrollDate.getMonth() + 1, 0).getDate();
  const period = `1–${lastDay} ${month}`;
  const employees = await prisma.user.findMany({
    where: { role: { in: ['employee', 'hr'] }, isActive: true },
    select: {
      id: true,
      basicSalary: true,
      salaryAllowances: true,
      salaryBonus: true,
      salaryTax: true,
      salaryProvidentFund: true,
    },
  });
  const latestPayments = await prisma.salaryPayment.findMany({
    where: { userId: { in: employees.map((employee) => employee.id) } },
    orderBy: { createdAt: 'desc' },
  });
  const latestByUser = new Map<string, (typeof latestPayments)[number]>();
  for (const payment of latestPayments) {
    if (!latestByUser.has(payment.userId)) latestByUser.set(payment.userId, payment);
  }
  await prisma.$transaction(
    employees.map((employee) => {
      const latest = latestByUser.get(employee.id);
      return prisma.salaryPayment.upsert({
        where: { userId_month: { userId: employee.id, month } },
        update: {},
        create: {
          userId: employee.id,
          month,
          period,
          basic: employee.basicSalary || latest?.basic || 0,
          allowances: employee.basicSalary ? employee.salaryAllowances : (latest?.allowances ?? 0),
          bonus: employee.basicSalary ? employee.salaryBonus : (latest?.bonus ?? 0),
          tax: employee.basicSalary ? employee.salaryTax : (latest?.tax ?? 0),
          providentFund: employee.basicSalary
            ? employee.salaryProvidentFund
            : (latest?.providentFund ?? 0),
          status: 'upcoming',
        },
      });
    }),
  );
  return { month, generated: employees.length };
}

export async function savePayroll(input: PayrollInput) {
  const { userId, month, paidOn, ...rest } = input;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) throw new ApiError(404, 'User not found.');
  return prisma.$transaction(async (transaction) => {
    const payment = await transaction.salaryPayment.upsert({
      where: { userId_month: { userId, month } },
      update: { ...rest, paidOn: paidOn ? new Date(paidOn) : null },
      create: { ...rest, userId, month, paidOn: paidOn ? new Date(paidOn) : null },
    });
    await transaction.user.update({
      where: { id: userId },
      data: {
        basicSalary: rest.basic,
        salaryAllowances: rest.allowances,
        salaryBonus: rest.bonus,
        salaryTax: rest.tax,
        salaryProvidentFund: rest.providentFund,
      },
    });
    return payment;
  });
}

export async function updatePayrollStatus(id: string, input: PayrollStatusInput) {
  const exists = await prisma.salaryPayment.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw new ApiError(404, 'Payroll record not found.');
  return prisma.salaryPayment.update({
    where: { id },
    data: {
      status: input.status,
      paidOn: input.status === 'paid' ? new Date() : null,
    },
    include: { user: { select: { employeeId: true, fullName: true, role: true } } },
  });
}
