import { getCookie } from 'hono/cookie';
import { Hono, type Context } from 'hono';
import { prisma } from '../../lib/prisma.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { leaveRequestSchema } from './leave.schema.js';

async function currentUser(c: Context) {
  try { return await getCurrentUser(getCookie(c, 'workpilot_access') ?? ''); } catch { return null; }
}

export const leaveRoutes = new Hono()
  .get('/', async (c) => {
    const user = await currentUser(c);
    if (!user) return c.json({ message: 'Unauthorized.' }, 401);
    const search = c.req.query('search')?.trim().toLowerCase() ?? '';
    const page = Math.max(Number(c.req.query('page')) || 0, 0);
    const limit = Math.min(Math.max(Number(c.req.query('limit')) || 6, 1), 20);
    const requests = await prisma.leaveRequest.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
    const matched = search ? requests.filter((request) => [
      user.employeeId, request.leaveType, request.reason, request.status,
      request.startDate.toISOString(), request.endDate.toISOString(),
      request.startDate.toLocaleDateString('en-US'), request.endDate.toLocaleDateString('en-US'),
    ].join(' ').toLowerCase().includes(search)) : requests;
    const start = page * limit;
    return c.json({ requests: matched.slice(start, start + limit), nextPage: start + limit < matched.length ? page + 1 : null });
  })
  .post('/', async (c) => {
    const user = await currentUser(c);
    if (!user) return c.json({ message: 'Unauthorized.' }, 401);
    const parsed = leaveRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ message: parsed.error.issues[0]?.message ?? 'Invalid leave request.' }, 400);
    const request = await prisma.leaveRequest.create({ data: { ...parsed.data, userId: user.id, startDate: new Date(parsed.data.startDate), endDate: new Date(parsed.data.endDate) } });
    return c.json({ request }, 201);
  })
  .patch('/:id', async (c) => {
    const user = await currentUser(c);
    if (!user) return c.json({ message: 'Unauthorized.' }, 401);
    const existing = await prisma.leaveRequest.findFirst({ where: { id: c.req.param('id'), userId: user.id } });
    if (!existing) return c.json({ message: 'Leave request not found.' }, 404);
    if (existing.status !== 'pending') return c.json({ message: 'Only pending requests can be edited.' }, 403);
    const parsed = leaveRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ message: parsed.error.issues[0]?.message ?? 'Invalid leave request.' }, 400);
    const request = await prisma.leaveRequest.update({ where: { id: existing.id }, data: { ...parsed.data, startDate: new Date(parsed.data.startDate), endDate: new Date(parsed.data.endDate) } });
    return c.json({ request });
  })
  .delete('/:id', async (c) => {
    const user = await currentUser(c);
    if (!user) return c.json({ message: 'Unauthorized.' }, 401);
    const existing = await prisma.leaveRequest.findFirst({ where: { id: c.req.param('id'), userId: user.id } });
    if (!existing) return c.json({ message: 'Leave request not found.' }, 404);
    if (existing.status !== 'pending') return c.json({ message: 'Only pending requests can be deleted.' }, 403);
    await prisma.leaveRequest.delete({ where: { id: existing.id } });
    return c.json({ message: 'Leave request deleted.' });
  });
