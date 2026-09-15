import { getCookie } from 'hono/cookie';
import { Hono, type Context } from 'hono';
import { getListQuery, pagination } from '../../lib/list-query.js';
import { prisma } from '../../lib/prisma.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { taskStatusSchema } from './tasks.schema.js';

async function currentUser(c: Context) {
  try {
    return await getCurrentUser(getCookie(c, 'workpilot_access') ?? '');
  } catch {
    return null;
  }
}

export const taskRoutes = new Hono()
  .get('/', async (c) => {
    const user = await currentUser(c);
    if (!user) return c.json({ message: 'Unauthorized.' }, 401);
    const query = getListQuery(c, 20);
    const status = ['todo', 'in_progress', 'completed'].includes(query.status ?? '')
      ? query.status
      : undefined;
    const where = {
      userId: user.id,
      ...(status ? { status } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' as const } },
              { description: { contains: query.search, mode: 'insensitive' as const } },
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
      prisma.task.groupBy({ where: { userId: user.id }, by: ['status'], _count: { _all: true } }),
    ]);
    const counts = Object.fromEntries(grouped.map((item) => [item.status, item._count._all]));
    return c.json({
      tasks,
      pagination: pagination(total, query.page, query.limit),
      summary: {
        total: Object.values(counts).reduce((sum, count) => sum + count, 0),
        open: (counts.todo ?? 0) + (counts.in_progress ?? 0),
        inProgress: counts.in_progress ?? 0,
        completed: counts.completed ?? 0,
      },
    });
  })
  .patch('/:id/status', async (c) => {
    const user = await currentUser(c);
    if (!user) return c.json({ message: 'Unauthorized.' }, 401);
    const parsed = taskStatusSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ message: 'Select a valid task status.' }, 400);
    const task = await prisma.task.findFirst({ where: { id: c.req.param('id'), userId: user.id } });
    if (!task) return c.json({ message: 'Task not found.' }, 404);
    const updated = await prisma.task.update({
      where: { id: task.id },
      data: { status: parsed.data.status },
    });
    return c.json({ task: updated });
  });
