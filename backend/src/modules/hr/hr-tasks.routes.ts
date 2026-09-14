import { getCookie } from 'hono/cookie';
import { Hono, type Context } from 'hono';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { getCurrentUser } from '../auth/auth.service.js';

const taskSchema = z.object({
  userId: z.string().min(1),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(1200).optional().default(''),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['todo', 'in_progress', 'completed']),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .or(z.literal(''))
    .optional()
    .default(''),
});

async function authorizeHr(c: Context) {
  try {
    const user = await getCurrentUser(getCookie(c, 'workpilot_access') ?? '');
    return ['hr', 'admin'].includes(user.role) ? user : null;
  } catch {
    return null;
  }
}

async function activeEmployee(userId: string) {
  return prisma.user.findFirst({
    where: { id: userId, role: 'employee', isActive: true },
    select: { id: true },
  });
}

function taskData(input: z.infer<typeof taskSchema>) {
  return {
    userId: input.userId,
    title: input.title,
    description: input.description || null,
    priority: input.priority,
    status: input.status,
    dueDate: input.dueDate ? new Date(`${input.dueDate}T23:59:59.999Z`) : null,
  };
}

export const hrTasksRoutes = new Hono()
  .get('/', async (c) => {
    if (!(await authorizeHr(c))) return c.json({ message: 'Unauthorized.' }, 403);

    const [tasks, employees] = await Promise.all([
      prisma.task.findMany({
        orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
        include: {
          user: {
            select: { id: true, employeeId: true, fullName: true, profileImage: true },
          },
        },
      }),
      prisma.user.findMany({
        where: { role: 'employee', isActive: true },
        orderBy: [{ fullName: 'asc' }, { employeeId: 'asc' }],
        select: { id: true, employeeId: true, fullName: true },
      }),
    ]);

    return c.json({ tasks, employees });
  })
  .post('/', async (c) => {
    if (!(await authorizeHr(c))) return c.json({ message: 'Unauthorized.' }, 403);

    const result = taskSchema.safeParse(await c.req.json().catch(() => null));
    if (!result.success) return c.json({ message: 'Please provide valid task details.' }, 400);
    if (!(await activeEmployee(result.data.userId))) {
      return c.json({ message: 'Select an active employee.' }, 400);
    }

    const task = await prisma.task.create({
      data: taskData(result.data),
      include: {
        user: { select: { id: true, employeeId: true, fullName: true, profileImage: true } },
      },
    });
    return c.json({ task }, 201);
  })
  .patch('/:id', async (c) => {
    if (!(await authorizeHr(c))) return c.json({ message: 'Unauthorized.' }, 403);

    const result = taskSchema.safeParse(await c.req.json().catch(() => null));
    if (!result.success) return c.json({ message: 'Please provide valid task details.' }, 400);
    if (!(await activeEmployee(result.data.userId))) {
      return c.json({ message: 'Select an active employee.' }, 400);
    }

    const task = await prisma.task
      .update({
        where: { id: c.req.param('id') },
        data: taskData(result.data),
        include: {
          user: { select: { id: true, employeeId: true, fullName: true, profileImage: true } },
        },
      })
      .catch(() => null);

    return task ? c.json({ task }) : c.json({ message: 'Task not found.' }, 404);
  })
  .delete('/:id', async (c) => {
    if (!(await authorizeHr(c))) return c.json({ message: 'Unauthorized.' }, 403);

    const task = await prisma.task.delete({ where: { id: c.req.param('id') } }).catch(() => null);
    return task
      ? c.json({ message: 'Task deleted.' })
      : c.json({ message: 'Task not found.' }, 404);
  });
