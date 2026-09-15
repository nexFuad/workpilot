import { getCookie } from 'hono/cookie';
import { Hono, type Context } from 'hono';
import { getListQuery, pagination } from '../../lib/list-query.js';
import { prisma } from '../../lib/prisma.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { leaveRequestSchema } from './leave.schema.js';

async function currentUser(c: Context) {
  try {
    return await getCurrentUser(getCookie(c, 'workpilot_access') ?? '');
  } catch {
    return null;
  }
}

export const leaveRoutes = new Hono()
  .get('/', async (c) => {
    const user = await currentUser(c);
    if (!user) return c.json({ message: 'Unauthorized.' }, 401);
    const query = getListQuery(c, 20);
    const status = ['pending', 'approved', 'rejected'].includes(query.status ?? '')
      ? query.status
      : undefined;
    const where = {
      userId: user.id,
      ...(status ? { status } : {}),
      ...(query.search
        ? {
            OR: [
              { leaveType: { contains: query.search, mode: 'insensitive' as const } },
              { reason: { contains: query.search, mode: 'insensitive' as const } },
              { status: { contains: query.search, mode: 'insensitive' as const } },
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
    return c.json({ requests, pagination: pagination(total, query.page, query.limit) });
  })
  .post('/', async (c) => {
    const user = await currentUser(c);
    if (!user) return c.json({ message: 'Unauthorized.' }, 401);
    const parsed = leaveRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success)
      return c.json({ message: parsed.error.issues[0]?.message ?? 'Invalid leave request.' }, 400);
    const request = await prisma.leaveRequest.create({
      data: {
        ...parsed.data,
        userId: user.id,
        startDate: new Date(parsed.data.startDate),
        endDate: new Date(parsed.data.endDate),
      },
    });
    return c.json({ request }, 201);
  })
  .patch('/:id', async (c) => {
    const user = await currentUser(c);
    if (!user) return c.json({ message: 'Unauthorized.' }, 401);
    const existing = await prisma.leaveRequest.findFirst({
      where: { id: c.req.param('id'), userId: user.id },
    });
    if (!existing) return c.json({ message: 'Leave request not found.' }, 404);
    if (existing.status !== 'pending')
      return c.json({ message: 'Only pending requests can be edited.' }, 403);
    const parsed = leaveRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success)
      return c.json({ message: parsed.error.issues[0]?.message ?? 'Invalid leave request.' }, 400);
    const request = await prisma.leaveRequest.update({
      where: { id: existing.id },
      data: {
        ...parsed.data,
        startDate: new Date(parsed.data.startDate),
        endDate: new Date(parsed.data.endDate),
      },
    });
    return c.json({ request });
  })
  .delete('/:id', async (c) => {
    const user = await currentUser(c);
    if (!user) return c.json({ message: 'Unauthorized.' }, 401);
    const existing = await prisma.leaveRequest.findFirst({
      where: { id: c.req.param('id'), userId: user.id },
    });
    if (!existing) return c.json({ message: 'Leave request not found.' }, 404);
    if (existing.status !== 'pending')
      return c.json({ message: 'Only pending requests can be deleted.' }, 403);
    await prisma.leaveRequest.delete({ where: { id: existing.id } });
    return c.json({ message: 'Leave request deleted.' });
  });
