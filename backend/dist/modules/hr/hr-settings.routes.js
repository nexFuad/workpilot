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
const siteSchema = z.object({
    name: z.string().trim().min(2).max(100),
    location: z.string().trim().min(2).max(200),
    isActive: z.boolean().default(true),
});
const shiftSchema = z.object({
    name: z.string().trim().min(2).max(100),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    isActive: z.boolean().default(true),
});
async function reviewer(c) {
    const user = await currentUser(c);
    return user?.role === 'hr' ? user : null;
}
export const hrSettingsRoutes = new Hono()
    .get('/sites', async (c) => {
    if (!(await reviewer(c)))
        return c.json({ message: 'Unauthorized.' }, 403);
    const query = getListQuery(c);
    const where = {
        ...(query.search
            ? {
                OR: [
                    { name: { contains: query.search, mode: 'insensitive' } },
                    { location: { contains: query.search, mode: 'insensitive' } },
                ],
            }
            : {}),
    };
    const [sites, total] = await Promise.all([
        prisma.site.findMany({
            where,
            orderBy: { name: 'asc' },
            skip: query.skip,
            take: query.limit,
        }),
        prisma.site.count({ where }),
    ]);
    return c.json({ sites, pagination: pagination(total, query.page, query.limit) });
})
    .post('/sites', async (c) => {
    if (!(await reviewer(c)))
        return c.json({ message: 'Unauthorized.' }, 403);
    const data = siteSchema.safeParse(await c.req.json().catch(() => null));
    if (!data.success)
        return c.json({ message: 'Invalid site information.' }, 400);
    const site = await prisma.site.create({ data: data.data }).catch(() => null);
    return site
        ? c.json({ site }, 201)
        : c.json({ message: 'A site with this name already exists.' }, 409);
})
    .patch('/sites/:id', async (c) => {
    if (!(await reviewer(c)))
        return c.json({ message: 'Unauthorized.' }, 403);
    const data = siteSchema.safeParse(await c.req.json().catch(() => null));
    if (!data.success)
        return c.json({ message: 'Invalid site information.' }, 400);
    const site = await prisma.site
        .update({ where: { id: c.req.param('id') }, data: data.data })
        .catch(() => null);
    return site ? c.json({ site }) : c.json({ message: 'Site not found.' }, 404);
})
    .delete('/sites/:id', async (c) => {
    if (!(await reviewer(c)))
        return c.json({ message: 'Unauthorized.' }, 403);
    const site = await prisma.site.delete({ where: { id: c.req.param('id') } }).catch(() => null);
    return site
        ? c.json({ message: 'Site deleted.' })
        : c.json({ message: 'Site cannot be deleted because it is used by attendance records.' }, 409);
})
    .get('/shifts', async (c) => {
    if (!(await reviewer(c)))
        return c.json({ message: 'Unauthorized.' }, 403);
    const query = getListQuery(c);
    const where = {
        ...(query.search
            ? {
                OR: [
                    { name: { contains: query.search, mode: 'insensitive' } },
                    { startTime: { contains: query.search, mode: 'insensitive' } },
                    { endTime: { contains: query.search, mode: 'insensitive' } },
                ],
            }
            : {}),
    };
    const [shifts, total] = await Promise.all([
        prisma.shift.findMany({
            where,
            orderBy: { startTime: 'asc' },
            skip: query.skip,
            take: query.limit,
        }),
        prisma.shift.count({ where }),
    ]);
    return c.json({ shifts, pagination: pagination(total, query.page, query.limit) });
})
    .post('/shifts', async (c) => {
    if (!(await reviewer(c)))
        return c.json({ message: 'Unauthorized.' }, 403);
    const data = shiftSchema.safeParse(await c.req.json().catch(() => null));
    if (!data.success)
        return c.json({ message: 'Invalid shift information.' }, 400);
    const shift = await prisma.shift.create({ data: data.data }).catch(() => null);
    return shift
        ? c.json({ shift }, 201)
        : c.json({ message: 'A shift with this name already exists.' }, 409);
})
    .patch('/shifts/:id', async (c) => {
    if (!(await reviewer(c)))
        return c.json({ message: 'Unauthorized.' }, 403);
    const data = shiftSchema.safeParse(await c.req.json().catch(() => null));
    if (!data.success)
        return c.json({ message: 'Invalid shift information.' }, 400);
    const shift = await prisma.shift
        .update({ where: { id: c.req.param('id') }, data: data.data })
        .catch(() => null);
    return shift ? c.json({ shift }) : c.json({ message: 'Shift not found.' }, 404);
})
    .delete('/shifts/:id', async (c) => {
    if (!(await reviewer(c)))
        return c.json({ message: 'Unauthorized.' }, 403);
    const shift = await prisma.shift.delete({ where: { id: c.req.param('id') } }).catch(() => null);
    return shift
        ? c.json({ message: 'Shift deleted.' })
        : c.json({ message: 'Shift cannot be deleted because it is used by attendance records.' }, 409);
});
