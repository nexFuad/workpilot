import { getCookie } from 'hono/cookie';
import { Hono, type Context } from 'hono';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { getListQuery, pagination } from '../../lib/list-query.js';
import { prisma } from '../../lib/prisma.js';
import { getCurrentUser } from '../auth/auth.service.js';

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .or(z.literal(''));

const projectSchema = z
  .object({
    name: z.string().trim().min(3).max(160),
    description: z.string().trim().max(2000).optional().default(''),
    status: z.enum(['planned', 'active', 'on_hold', 'completed']),
    progress: z.number().int().min(0).max(100),
    startDate: dateSchema.optional().default(''),
    endDate: dateSchema.optional().default(''),
    assignments: z
      .array(
        z.object({
          userId: z.string().min(1),
          role: z.string().trim().min(2).max(80),
        }),
      )
      .min(1)
      .max(50),
  })
  .superRefine((data, context) => {
    if (new Set(data.assignments.map((item) => item.userId)).size !== data.assignments.length) {
      context.addIssue({ code: 'custom', message: 'Each employee can only be assigned once.' });
    }
    if (data.startDate && data.endDate && data.startDate > data.endDate) {
      context.addIssue({ code: 'custom', message: 'End date must be after the start date.' });
    }
  });

async function authorizeHr(c: Context) {
  try {
    const user = await getCurrentUser(getCookie(c, 'workpilot_access') ?? '');
    return user.role === 'hr' ? user : null;
  } catch {
    return null;
  }
}

async function assignmentsAreValid(userIds: string[]) {
  const employees = await prisma.user.count({
    where: { id: { in: userIds }, role: 'employee', isActive: true },
  });
  return employees === userIds.length;
}

function projectData(input: z.infer<typeof projectSchema>) {
  return {
    name: input.name,
    description: input.description || null,
    status: input.status,
    progress: input.progress,
    startDate: input.startDate ? new Date(`${input.startDate}T00:00:00.000Z`) : null,
    endDate: input.endDate ? new Date(`${input.endDate}T23:59:59.999Z`) : null,
  };
}

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

export const hrProjectsRoutes = new Hono()
  .get('/', async (c) => {
    if (!(await authorizeHr(c))) return c.json({ message: 'Unauthorized.' }, 403);

    const query = getListQuery(c);
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
    return c.json({
      projects,
      employees,
      pagination: pagination(total, query.page, query.limit),
      summary: {
        total: Object.values(counts).reduce((sum, count) => sum + count, 0),
        active: counts.active ?? 0,
        completed: counts.completed ?? 0,
        assignments: totalAssignments,
      },
    });
  })
  .post('/', async (c) => {
    if (!(await authorizeHr(c))) return c.json({ message: 'Unauthorized.' }, 403);

    const result = projectSchema.safeParse(await c.req.json().catch(() => null));
    if (!result.success) return c.json({ message: 'Please provide valid project details.' }, 400);
    if (!(await assignmentsAreValid(result.data.assignments.map((item) => item.userId)))) {
      return c.json({ message: 'Every team member must be an active employee.' }, 400);
    }

    const project = await prisma.project.create({
      data: {
        ...projectData(result.data),
        assignments: { create: result.data.assignments },
      },
      include: projectInclude,
    });
    return c.json({ project }, 201);
  })
  .patch('/:id', async (c) => {
    if (!(await authorizeHr(c))) return c.json({ message: 'Unauthorized.' }, 403);

    const result = projectSchema.safeParse(await c.req.json().catch(() => null));
    if (!result.success) return c.json({ message: 'Please provide valid project details.' }, 400);
    if (!(await assignmentsAreValid(result.data.assignments.map((item) => item.userId)))) {
      return c.json({ message: 'Every team member must be an active employee.' }, 400);
    }

    const exists = await prisma.project.findUnique({
      where: { id: c.req.param('id') },
      select: { id: true },
    });
    if (!exists) return c.json({ message: 'Project not found.' }, 404);

    const project = await prisma.$transaction(async (transaction) => {
      await transaction.project.update({
        where: { id: exists.id },
        data: projectData(result.data),
      });
      await transaction.projectAssignment.deleteMany({ where: { projectId: exists.id } });
      await transaction.projectAssignment.createMany({
        data: result.data.assignments.map((assignment) => ({
          projectId: exists.id,
          ...assignment,
        })),
      });
      return transaction.project.findUniqueOrThrow({
        where: { id: exists.id },
        include: projectInclude,
      });
    });

    return c.json({ project });
  })
  .delete('/:id', async (c) => {
    if (!(await authorizeHr(c))) return c.json({ message: 'Unauthorized.' }, 403);

    const project = await prisma.project
      .delete({ where: { id: c.req.param('id') } })
      .catch(() => null);
    return project
      ? c.json({ message: 'Project deleted.' })
      : c.json({ message: 'Project not found.' }, 404);
  });
