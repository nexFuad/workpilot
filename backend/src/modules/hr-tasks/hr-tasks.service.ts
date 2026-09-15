import type { Prisma } from '@prisma/client';
import type { z } from 'zod';
import { ApiError } from '../../lib/api-error.js';
import { endOfUtcDate } from '../../lib/date.js';
import { pagination, type ListQuery } from '../../lib/list-query.js';
import { prisma } from '../../lib/prisma.js';
import { taskSchema } from './hr-tasks.schema.js';

type TaskInput = z.infer<typeof taskSchema>;

const taskInclude = {
  user: { select: { id: true, employeeId: true, fullName: true, profileImage: true } },
} as const;

async function ensureActiveEmployee(userId: string) {
  const employee = await prisma.user.findFirst({
    where: { id: userId, role: 'employee', isActive: true },
    select: { id: true },
  });
  if (!employee) throw new ApiError(400, 'Select an active employee.');
}

function taskData(input: TaskInput) {
  return {
    userId: input.userId,
    title: input.title,
    description: input.description || null,
    priority: input.priority,
    status: input.status,
    dueDate: input.dueDate ? endOfUtcDate(input.dueDate) : null,
  };
}

export async function listTasks(query: ListQuery) {
  const status = ['todo', 'in_progress', 'completed'].includes(query.status ?? '')
    ? query.status
    : undefined;
  const where: Prisma.TaskWhereInput = {
    ...(status ? { status } : {}),
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
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
  const [tasks, total, employees, grouped] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
      skip: query.skip,
      take: query.limit,
      include: taskInclude,
    }),
    prisma.task.count({ where }),
    prisma.user.findMany({
      where: { role: 'employee', isActive: true },
      orderBy: [{ fullName: 'asc' }, { employeeId: 'asc' }],
      select: { id: true, employeeId: true, fullName: true },
    }),
    prisma.task.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);
  const counts = Object.fromEntries(grouped.map((item) => [item.status, item._count._all]));
  return {
    tasks,
    employees,
    pagination: pagination(total, query.page, query.limit),
    summary: {
      total: Object.values(counts).reduce((sum, count) => sum + count, 0),
      todo: counts.todo ?? 0,
      inProgress: counts.in_progress ?? 0,
      completed: counts.completed ?? 0,
    },
  };
}

export async function createTask(input: TaskInput) {
  await ensureActiveEmployee(input.userId);
  return prisma.task.create({ data: taskData(input), include: taskInclude });
}

export async function updateTask(id: string, input: TaskInput) {
  await ensureActiveEmployee(input.userId);
  const exists = await prisma.task.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw new ApiError(404, 'Task not found.');
  return prisma.task.update({ where: { id }, data: taskData(input), include: taskInclude });
}

export async function deleteTask(id: string) {
  const exists = await prisma.task.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw new ApiError(404, 'Task not found.');
  await prisma.task.delete({ where: { id } });
}
