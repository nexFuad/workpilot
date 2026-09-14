import { getCookie } from 'hono/cookie';
import { Hono, type Context } from 'hono';
import { prisma } from '../../lib/prisma.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { z } from 'zod';
async function currentUser(c: Context) { try { return await getCurrentUser(getCookie(c, 'workpilot_access') ?? ''); } catch { return null; } }
const review = z.object({ status: z.enum(['approved', 'rejected']) });
export const hrLeaveRoutes = new Hono()
  .get('/', async (c) => { const user = await currentUser(c); if (!user || !['hr', 'admin'].includes(user.role)) return c.json({ message: 'Unauthorized.' }, 403); const requests = await prisma.leaveRequest.findMany({ orderBy: { createdAt: 'desc' }, include: { user: { select: { employeeId: true, fullName: true, companyName: true } } } }); return c.json({ requests }); })
  .patch('/:id/status', async (c) => { const user = await currentUser(c); if (!user || !['hr', 'admin'].includes(user.role)) return c.json({ message: 'Unauthorized.' }, 403); const data = review.safeParse(await c.req.json().catch(() => null)); if (!data.success) return c.json({ message: 'Select approve or reject.' }, 400); const request = await prisma.leaveRequest.update({ where: { id: c.req.param('id') }, data: { status: data.data.status } }).catch(() => null); return request ? c.json({ request }) : c.json({ message: 'Leave request not found.' }, 404); });
