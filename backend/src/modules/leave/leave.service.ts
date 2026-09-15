import type { Prisma } from '@prisma/client';
import { ApiError } from '../../lib/api-error.js';
import { pagination, type ListQuery } from '../../lib/list-query.js';
import { prisma } from '../../lib/prisma.js';
import type { z } from 'zod';
import { leaveRequestSchema } from './leave.schema.js';

type LeaveInput = z.infer<typeof leaveRequestSchema>;

export async function listLeaveRequests(userId: string, query: ListQuery) {
  const status = ['pending', 'approved', 'rejected'].includes(query.status ?? '')
    ? query.status
    : undefined;
  const where: Prisma.LeaveRequestWhereInput = {
    userId,
    ...(status ? { status } : {}),
    ...(query.search
      ? {
          OR: [
            { leaveType: { contains: query.search, mode: 'insensitive' } },
            { reason: { contains: query.search, mode: 'insensitive' } },
            { status: { contains: query.search, mode: 'insensitive' } },
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
    }),
    prisma.leaveRequest.count({ where }),
  ]);
  return { requests, pagination: pagination(total, query.page, query.limit) };
}

function leaveData(input: LeaveInput) {
  return {
    ...input,
    startDate: new Date(input.startDate),
    endDate: new Date(input.endDate),
  };
}

export function createLeaveRequest(userId: string, input: LeaveInput) {
  return prisma.leaveRequest.create({ data: { ...leaveData(input), userId } });
}

async function pendingRequest(id: string, userId: string) {
  const request = await prisma.leaveRequest.findFirst({ where: { id, userId } });
  if (!request) throw new ApiError(404, 'Leave request not found.');
  if (request.status !== 'pending') {
    throw new ApiError(403, 'Only pending requests can be changed.');
  }
  return request;
}

export async function updateLeaveRequest(id: string, userId: string, input: LeaveInput) {
  const request = await pendingRequest(id, userId);
  return prisma.leaveRequest.update({ where: { id: request.id }, data: leaveData(input) });
}

export async function deleteLeaveRequest(id: string, userId: string) {
  const request = await pendingRequest(id, userId);
  await prisma.leaveRequest.delete({ where: { id: request.id } });
}
