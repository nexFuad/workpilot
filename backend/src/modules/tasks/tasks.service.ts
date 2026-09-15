import type { Prisma } from '@prisma/client';
import { ApiError } from '../../lib/api-error.js';
import { pagination, type ListQuery } from '../../lib/list-query.js';
import { prisma } from '../../lib/prisma.js';
import type { z } from 'zod';
import { taskStatusSchema } from './tasks.schema.js';

type TaskStatusInput = z.infer<typeof taskStatusSchema>;

export async function listTasks(userId: string, query: ListQuery) {
  const status = ['todo', 'in_progress', 'completed'].includes(query.status ?? '')
    ? query.status
    : undefined;
  const where: Prisma.TaskWhereInput = {
    userId,
    ...(status ? { status } : {}),
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
  const [tasks, total, grouped] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
      skip: query.skip,
      take: query.limit,
    }),
    prisma.task.count({ where }),
    prisma.task.groupBy({ where: { userId }, by: ['status'], _count: { _all: true } }),
  ]);
  const counts = Object.fromEntries(grouped.map((item) => [item.status, item._count._all]));
  return {
    tasks,
    pagination: pagination(total, query.page, query.limit),
    summary: {
      total: Object.values(counts).reduce((sum, count) => sum + count, 0),
      open: (counts.todo ?? 0) + (counts.in_progress ?? 0),
      inProgress: counts.in_progress ?? 0,
      completed: counts.completed ?? 0,
    },
  };
}

export async function updateTaskStatus(id: string, userId: string, input: TaskStatusInput) {
  const task = await prisma.task.findFirst({ where: { id, userId }, select: { id: true } });
  if (!task) throw new ApiError(404, 'Task not found.');
  return prisma.task.update({ where: { id: task.id }, data: { status: input.status } });
}
