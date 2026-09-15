import type { Prisma } from '@prisma/client';
import type { z } from 'zod';
import { ApiError } from '../../lib/api-error.js';
import { searchDateRange } from '../../lib/date.js';
import { pagination, type ListQuery } from '../../lib/list-query.js';
import { prisma } from '../../lib/prisma.js';
import { leaveReviewSchema } from './hr-leave.schema.js';

type LeaveReviewInput = z.infer<typeof leaveReviewSchema>;

export async function listLeaveRequests(query: ListQuery) {
  const status = ['pending', 'approved', 'rejected'].includes(query.status ?? '')
    ? query.status
    : undefined;
  const dateRange = query.search ? searchDateRange(query.search) : null;
  const where: Prisma.LeaveRequestWhereInput = {
    ...(status ? { status } : {}),
    ...(query.search
      ? {
          OR: [
            { leaveType: { contains: query.search, mode: 'insensitive' } },
            { reason: { contains: query.search, mode: 'insensitive' } },
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
            ...(dateRange
              ? [
                  {
                    AND: [{ startDate: { lt: dateRange.lt } }, { endDate: { gte: dateRange.gte } }],
                  },
                  { createdAt: dateRange },
                ]
              : []),
          ],
        }
      : {}),
  };
  const [requests, total] = await Promise.all([
    prisma.leaveRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: query.skip,
      take: query.limit,
      include: { user: { select: { employeeId: true, fullName: true, companyName: true } } },
    }),
    prisma.leaveRequest.count({ where }),
  ]);
  return { requests, pagination: pagination(total, query.page, query.limit) };
}

export async function reviewLeaveRequest(id: string, input: LeaveReviewInput) {
  const exists = await prisma.leaveRequest.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw new ApiError(404, 'Leave request not found.');
  return prisma.leaveRequest.update({ where: { id }, data: { status: input.status } });
}
