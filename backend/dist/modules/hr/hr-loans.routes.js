import { getCookie } from 'hono/cookie';
import { Hono } from 'hono';
import { prisma } from '../../lib/prisma.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { z } from 'zod';
import { getListQuery, pagination } from '../../lib/list-query.js';
async function currentUser(c) {
    try {
        return await getCurrentUser(getCookie(c, 'workpilot_access') ?? '');
    }
    catch {
        return null;
    }
}
const schema = z.object({ status: z.enum(['approved', 'rejected']) });
export const hrLoansRoutes = new Hono()
    .get('/', async (c) => {
    const u = await currentUser(c);
    if (!u || u.role !== 'hr')
        return c.json({ message: 'Unauthorized.' }, 403);
    const query = getListQuery(c);
    const status = ['pending', 'approved', 'rejected'].includes(query.status ?? '')
        ? query.status
        : undefined;
    const where = {
        ...(status ? { status } : {}),
        ...(query.search
            ? {
                OR: [
                    { purpose: { contains: query.search, mode: 'insensitive' } },
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
    const [requests, total] = await Promise.all([
        prisma.loanRequest.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: query.skip,
            take: query.limit,
            include: { user: { select: { employeeId: true, fullName: true } }, loan: true },
        }),
        prisma.loanRequest.count({ where }),
    ]);
    return c.json({
        requests,
        pagination: pagination(total, query.page, query.limit),
    });
})
    .patch('/:id/status', async (c) => {
    const u = await currentUser(c);
    if (!u || u.role !== 'hr')
        return c.json({ message: 'Unauthorized.' }, 403);
    const d = schema.safeParse(await c.req.json().catch(() => null));
    if (!d.success)
        return c.json({ message: 'Invalid status.' }, 400);
    const r = await prisma.loanRequest
        .update({
        where: { id: c.req.param('id') },
        data: { status: d.data.status, reviewedAt: new Date() },
    })
        .catch(() => null);
    if (!r)
        return c.json({ message: 'Request not found.' }, 404);
    if (d.data.status === 'approved')
        await prisma.loan.upsert({
            where: { requestId: r.id },
            update: {},
            create: {
                userId: r.userId,
                requestId: r.id,
                principal: r.amount,
                outstanding: r.amount,
                installment: Math.ceil(r.amount / r.tenure),
                tenure: r.tenure,
                nextDue: new Date(),
            },
        });
    return c.json({ request: r });
});
