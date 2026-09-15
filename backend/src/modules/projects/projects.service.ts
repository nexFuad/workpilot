import type { Prisma } from '@prisma/client';
import { pagination, type ListQuery } from '../../lib/list-query.js';
import { prisma } from '../../lib/prisma.js';
import { projectListSchema } from './projects.schema.js';

export async function listProjects(userId: string, query: ListQuery) {
  const parsedQuery = projectListSchema.safeParse({ status: query.status });
  const status = parsedQuery.success ? parsedQuery.data.status : undefined;
  const progressSearch = /^\d{1,3}$/.test(query.search) ? Number(query.search) : null;
  const where: Prisma.ProjectAssignmentWhereInput = {
    userId,
    project: { is: { ...(status ? { status } : {}) } },
    ...(query.search
      ? {
          OR: [
            { role: { contains: query.search, mode: 'insensitive' } },
            {
              project: {
                is: {
                  OR: [
                    { name: { contains: query.search, mode: 'insensitive' } },
                    { description: { contains: query.search, mode: 'insensitive' } },
                    { status: { contains: query.search, mode: 'insensitive' } },
                    ...(progressSearch === null ? [] : [{ progress: progressSearch }]),
                    {
                      assignments: {
                        some: {
                          OR: [
                            { role: { contains: query.search, mode: 'insensitive' } },
                            {
                              user: {
                                is: {
                                  OR: [
                                    {
                                      employeeId: {
                                        contains: query.search,
                                        mode: 'insensitive',
                                      },
                                    },
                                    {
                                      fullName: {
                                        contains: query.search,
                                        mode: 'insensitive',
                                      },
                                    },
                                  ],
                                },
                              },
                            },
                          ],
                        },
                      },
                    },
                  ],
                },
              },
            },
          ],
        }
      : {}),
  };
  const [assignments, total, allAssignments] = await Promise.all([
    prisma.projectAssignment.findMany({
      where,
      orderBy: { project: { endDate: 'asc' } },
      skip: query.skip,
      take: query.limit,
      include: {
        project: {
          include: {
            assignments: {
              orderBy: { joinedAt: 'asc' },
              include: {
                user: {
                  select: {
                    id: true,
                    employeeId: true,
                    fullName: true,
                    profileImage: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.projectAssignment.count({ where }),
    prisma.projectAssignment.findMany({
      where: { userId },
      select: { role: true, project: { select: { status: true, progress: true } } },
    }),
  ]);
  const progress = allAssignments.reduce((sum, item) => sum + item.project.progress, 0);
  return {
    projects: assignments.map(({ role, joinedAt, project }) => {
      const { assignments: teamMembers, ...projectDetails } = project;
      return { ...projectDetails, role, joinedAt, teamMembers };
    }),
    pagination: pagination(total, query.page, query.limit),
    summary: {
      total: allAssignments.length,
      active: allAssignments.filter((item) => item.project.status === 'active').length,
      averageProgress: allAssignments.length ? Math.round(progress / allAssignments.length) : 0,
      roles: new Set(allAssignments.map((item) => item.role)).size,
    },
  };
}
