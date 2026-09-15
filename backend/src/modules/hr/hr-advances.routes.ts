import { getCookie } from 'hono/cookie';
import { Hono, type Context } from 'hono';
import { prisma } from '../../lib/prisma.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { getListQuery, pagination } from '../../lib/list-query.js';
async function currentUser(c: Context) {
  try {
    return await getCurrentUser(getCookie(c, 'workpilot_access') ?? '');
  } catch {
    return null;
  }
}
const schema = z.object({ status: z.enum(['approved', 'rejected']) });
export const hrAdvancesRoutes = new Hono()
  .get('/', async (c) => {
    const user = await currentUser(c);
    if (!user || user.role !== 'hr') return c.json({ message: 'Unauthorized.' }, 403);
    const query = getListQuery(c);
    const status = ['pending', 'approved', 'rejected'].includes(query.status ?? '')
      ? query.status
      : undefined;
    const where: Prisma.SalaryAdvanceRequestWhereInput = {
      ...(status ? { status } : {}),
      ...(query.search
        ? {
            OR: [
              { reason: { contains: query.search, mode: 'insensitive' } },
              { settlementMonth: { contains: query.search, mode: 'insensitive' } },
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
      prisma.salaryAdvanceRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
        include: { user: { select: { employeeId: true, fullName: true } } },
      }),
      prisma.salaryAdvanceRequest.count({ where }),
    ]);
    return c.json({ requests, pagination: pagination(total, query.page, query.limit) });
  })
  .patch('/:id/status', async (c) => {
    const user = await currentUser(c);
    if (!user || user.role !== 'hr') return c.json({ message: 'Unauthorized.' }, 403);
    const data = schema.safeParse(await c.req.json().catch(() => null));
    if (!data.success) return c.json({ message: 'Invalid status.' }, 400);
    const request = await prisma.salaryAdvanceRequest
      .update({
        where: { id: c.req.param('id') },
        data: { status: data.data.status, reviewedAt: new Date() },
      })
      .catch(() => null);
    return request ? c.json({ request }) : c.json({ message: 'Request not found.' }, 404);
  });
