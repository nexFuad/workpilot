import { getCookie } from 'hono/cookie';
import { Hono } from 'hono';
import { getListQuery, pagination } from '../../lib/list-query.js';
import { prisma } from '../../lib/prisma.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { z } from 'zod';
async function currentUser(c) {
    try {
        return await getCurrentUser(getCookie(c, 'workpilot_access') ?? '');
    }
    catch {
        return null;
    }
}
const review = z.object({ status: z.enum(['approved', 'rejected']) });
const monthNumbers = {
    jan: 0,
    january: 0,
    feb: 1,
    february: 1,
    mar: 2,
    march: 2,
    apr: 3,
    april: 3,
    may: 4,
    jun: 5,
    june: 5,
    jul: 6,
    july: 6,
    aug: 7,
    august: 7,
    sep: 8,
    sept: 8,
    september: 8,
    oct: 9,
    october: 9,
    nov: 10,
    november: 10,
    dec: 11,
    december: 11,
};
function dayRange(year, month, day) {
    const gte = new Date(Date.UTC(year, month, day));
    if (gte.getUTCFullYear() !== year || gte.getUTCMonth() !== month || gte.getUTCDate() !== day) {
        return null;
    }
    const lt = new Date(gte);
    lt.setUTCDate(lt.getUTCDate() + 1);
    return { gte, lt };
}
function monthRange(year, month) {
    if (month < 0 || month > 11)
        return null;
    return {
        gte: new Date(Date.UTC(year, month, 1)),
        lt: new Date(Date.UTC(year, month + 1, 1)),
    };
}
function searchDateRange(value) {
    const search = value.trim().toLowerCase().replace(/,/g, '');
    const iso = search.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/);
    if (iso) {
        const year = Number(iso[1]);
        const month = Number(iso[2]) - 1;
        return iso[3] ? dayRange(year, month, Number(iso[3])) : monthRange(year, month);
    }
    const dayFirst = search.match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/);
    if (dayFirst) {
        const month = monthNumbers[dayFirst[2]];
        return month === undefined ? null : dayRange(Number(dayFirst[3]), month, Number(dayFirst[1]));
    }
    const monthFirst = search.match(/^([a-z]+)(?:\s+(\d{1,2}))?(?:\s+(\d{4}))?$/);
    if (!monthFirst)
        return null;
    const month = monthNumbers[monthFirst[1]];
    if (month === undefined)
        return null;
    const year = Number(monthFirst[3] ?? new Date().getUTCFullYear());
    return monthFirst[2] ? dayRange(year, month, Number(monthFirst[2])) : monthRange(year, month);
}
export const hrLeaveRoutes = new Hono()
    .get('/', async (c) => {
    const user = await currentUser(c);
    if (!user || user.role !== 'hr')
        return c.json({ message: 'Unauthorized.' }, 403);
    const query = getListQuery(c);
    const status = ['pending', 'approved', 'rejected'].includes(query.status ?? '')
        ? query.status
        : undefined;
    const dateRange = query.search ? searchDateRange(query.search) : null;
    const where = {
        ...(status ? { status } : {}),
        ...(query.search
            ? {
                OR: [
                    { leaveType: { contains: query.search, mode: 'insensitive' } },
                    { reason: { contains: query.search, mode: 'insensitive' } },
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
                    ...(dateRange
                        ? [
                            {
                                AND: [
                                    { startDate: { lt: dateRange.lt } },
                                    { endDate: { gte: dateRange.gte } },
                                ],
                            },
                            { createdAt: dateRange },
                        ]
                        : []),
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
            include: { user: { select: { employeeId: true, fullName: true, companyName: true } } },
        }),
        prisma.leaveRequest.count({ where }),
    ]);
    return c.json({ requests, pagination: pagination(total, query.page, query.limit) });
})
    .patch('/:id/status', async (c) => {
    const user = await currentUser(c);
    if (!user || user.role !== 'hr')
        return c.json({ message: 'Unauthorized.' }, 403);
    const data = review.safeParse(await c.req.json().catch(() => null));
    if (!data.success)
        return c.json({ message: 'Select approve or reject.' }, 400);
    const request = await prisma.leaveRequest
        .update({ where: { id: c.req.param('id') }, data: { status: data.data.status } })
        .catch(() => null);
    return request ? c.json({ request }) : c.json({ message: 'Leave request not found.' }, 404);
});
