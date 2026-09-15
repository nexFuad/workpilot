import type { Prisma } from '@prisma/client';
import { pagination, type ListQuery } from '../../lib/list-query.js';
import { prisma } from '../../lib/prisma.js';
import { reviewAdvanceRequest } from '../compensation/compensation.service.js';

export async function listAdvanceRequests(query: ListQuery) {
  const status = ['pending', 'approved', 'rejected'].includes(query.status ?? '')
    ? query.status
    : undefined;
  const where: Prisma.SalaryAdvanceRequestWhereInput = {
    ...(status ? { status } : {}),
    ...(query.search
      ? {
          OR: [
            { reason: { contains: query.search, mode: 'insensitive' } },
            { settlementMonth: { contains: query.search, mode: 'insensitive' } },
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
    prisma.salaryAdvanceRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: query.skip,
      take: query.limit,
      include: { user: { select: { employeeId: true, fullName: true } } },
    }),
    prisma.salaryAdvanceRequest.count({ where }),
  ]);
  return { requests, pagination: pagination(total, query.page, query.limit) };
}

export { reviewAdvanceRequest };
