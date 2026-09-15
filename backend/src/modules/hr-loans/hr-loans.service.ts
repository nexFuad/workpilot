import type { Prisma } from '@prisma/client';
import { pagination, type ListQuery } from '../../lib/list-query.js';
import { prisma } from '../../lib/prisma.js';
import { reviewLoanRequest } from '../compensation/compensation.service.js';

export async function listLoanRequests(query: ListQuery) {
  const status = ['pending', 'approved', 'rejected'].includes(query.status ?? '')
    ? query.status
    : undefined;
  const where: Prisma.LoanRequestWhereInput = {
    ...(status ? { status } : {}),
    ...(query.search
      ? {
          OR: [
            { purpose: { contains: query.search, mode: 'insensitive' } },
            {
              user: {
                is: {
                  OR: [
                    { employeeId: { contains: query.search, mode: 'insensitive' } },
                    { fullName: { contains: query.search, mode: 'insensitive' } },
                  ],
                },
              },
            },
          ],
        }
      : {}),
  };
  const [requests, total] = await Promise.all([
    prisma.loanRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: query.skip,
      take: query.limit,
      include: { user: { select: { employeeId: true, fullName: true } }, loan: true },
    }),
    prisma.loanRequest.count({ where }),
  ]);
  return { requests, pagination: pagination(total, query.page, query.limit) };
}

export { reviewLoanRequest };
