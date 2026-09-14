import { getCookie } from 'hono/cookie';
import { Hono } from 'hono';
import { prisma } from '../../lib/prisma.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { z } from 'zod';
async function currentUser(c) { try {
    return await getCurrentUser(getCookie(c, 'workpilot_access') ?? '');
}
catch {
    return null;
} }
const schema = z.object({ status: z.enum(['approved', 'rejected']) });
export const hrLoansRoutes = new Hono().get('/', async (c) => { const u = await currentUser(c); if (!u || !['hr', 'admin'].includes(u.role))
    return c.json({ message: 'Unauthorized.' }, 403); return c.json({ requests: await prisma.loanRequest.findMany({ orderBy: { createdAt: 'desc' }, include: { user: { select: { employeeId: true, fullName: true } }, loan: true } }) }); }).patch('/:id/status', async (c) => { const u = await currentUser(c); if (!u || !['hr', 'admin'].includes(u.role))
    return c.json({ message: 'Unauthorized.' }, 403); const d = schema.safeParse(await c.req.json().catch(() => null)); if (!d.success)
    return c.json({ message: 'Invalid status.' }, 400); const r = await prisma.loanRequest.update({ where: { id: c.req.param('id') }, data: { status: d.data.status, reviewedAt: new Date() } }).catch(() => null); if (!r)
    return c.json({ message: 'Request not found.' }, 404); if (d.data.status === 'approved')
    await prisma.loan.upsert({ where: { requestId: r.id }, update: {}, create: { userId: r.userId, requestId: r.id, principal: r.amount, outstanding: r.amount, installment: Math.ceil(r.amount / r.tenure), tenure: r.tenure, nextDue: new Date() } }); return c.json({ request: r }); });
