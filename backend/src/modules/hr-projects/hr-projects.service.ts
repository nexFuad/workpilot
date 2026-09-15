import type { Prisma } from '@prisma/client';
import type { z } from 'zod';
import { ApiError } from '../../lib/api-error.js';
import { endOfUtcDate } from '../../lib/date.js';
import { pagination, type ListQuery } from '../../lib/list-query.js';
import { prisma } from '../../lib/prisma.js';
import { projectSchema } from './hr-projects.schema.js';

type ProjectInput = z.infer<typeof projectSchema>;

const projectInclude = {
  assignments: {
    orderBy: { joinedAt: 'asc' as const },
    include: {
      user: {
        select: { id: true, employeeId: true, fullName: true, profileImage: true },
      },
    },
  },
};

async function ensureValidAssignments(userIds: string[]) {
  const employees = await prisma.user.count({
    where: { id: { in: userIds }, role: 'employee', isActive: true },
  });
  if (employees !== userIds.length) {
    throw new ApiError(400, 'Every team member must be an active employee.');
  }
}

function projectData(input: ProjectInput) {
  return {
    name: input.name,
    description: input.description || null,
    status: input.status,
    progress: input.progress,
    startDate: input.startDate ? new Date(`${input.startDate}T00:00:00.000Z`) : null,
    endDate: input.endDate ? endOfUtcDate(input.endDate) : null,
  };
}

export async function listProjects(query: ListQuery) {
  const status = ['planned', 'active', 'on_hold', 'completed'].includes(query.status ?? '')
    ? query.status
    : undefined;
  const where: Prisma.ProjectWhereInput = {
    ...(status ? { status } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
            {
              assignments: {
                some: {
                  user: {
                    is: {
                      OR: [
                        { employeeId: { contains: query.search, mode: 'insensitive' } },
                        { fullName: { contains: query.search, mode: 'insensitive' } },
                      ],
                    },
                  },
                },
              },
            },
          ],
        }
      : {}),
  };
  const [projects, total, employees, grouped, totalAssignments] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: query.skip,
      take: query.limit,
      include: projectInclude,
    }),
    prisma.project.count({ where }),
    prisma.user.findMany({
      where: { role: 'employee', isActive: true },
      orderBy: [{ fullName: 'asc' }, { employeeId: 'asc' }],
      select: { id: true, employeeId: true, fullName: true },
    }),
    prisma.project.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.projectAssignment.count(),
  ]);
  const counts = Object.fromEntries(grouped.map((item) => [item.status, item._count._all]));
  return {
    projects,
    employees,
    pagination: pagination(total, query.page, query.limit),
    summary: {
      total: Object.values(counts).reduce((sum, count) => sum + count, 0),
      active: counts.active ?? 0,
      completed: counts.completed ?? 0,
      assignments: totalAssignments,
    },
  };
}

export async function createProject(input: ProjectInput) {
  await ensureValidAssignments(input.assignments.map((item) => item.userId));
  return prisma.project.create({
    data: {
      ...projectData(input),
      assignments: { create: input.assignments },
    },
    include: projectInclude,
  });
}

export async function updateProject(id: string, input: ProjectInput) {
  await ensureValidAssignments(input.assignments.map((item) => item.userId));
  const exists = await prisma.project.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw new ApiError(404, 'Project not found.');
  return prisma.$transaction(async (transaction) => {
    await transaction.project.update({ where: { id }, data: projectData(input) });
    await transaction.projectAssignment.deleteMany({ where: { projectId: id } });
    await transaction.projectAssignment.createMany({
      data: input.assignments.map((assignment) => ({ projectId: id, ...assignment })),
    });
    return transaction.project.findUniqueOrThrow({ where: { id }, include: projectInclude });
  });
}

export async function deleteProject(id: string) {
  const exists = await prisma.project.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw new ApiError(404, 'Project not found.');
  await prisma.project.delete({ where: { id } });
}
