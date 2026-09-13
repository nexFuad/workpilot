import { getCookie } from 'hono/cookie';
import { Hono } from 'hono';
import { prisma } from '../../lib/prisma.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { attendanceActionSchema } from './attendance.schema.js';
async function currentUser(c) {
    try {
        return await getCurrentUser(getCookie(c, 'workpilot_access') ?? '');
    }
    catch {
        return null;
    }
}
const attendanceInclude = {
    checkInSite: true,
    checkInShift: true,
    checkOutSite: true,
    checkOutShift: true,
};
export const attendanceRoutes = new Hono()
    .get('/options', async (c) => {
    const user = await currentUser(c);
    if (!user)
        return c.json({ message: 'Unauthorized.' }, 401);
    const [sites, shifts] = await Promise.all([
        prisma.site.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
        prisma.shift.findMany({ where: { isActive: true }, orderBy: { startTime: 'asc' } }),
    ]);
    return c.json({ sites, shifts });
})
    .get('/current', async (c) => {
    const user = await currentUser(c);
    if (!user)
        return c.json({ message: 'Unauthorized.' }, 401);
    const attendance = await prisma.attendance.findFirst({
        where: { userId: user.id, checkOutAt: null },
        orderBy: { checkInAt: 'desc' },
        include: attendanceInclude,
    });
    return c.json({ attendance });
})
    .get('/history', async (c) => {
    const user = await currentUser(c);
    if (!user)
        return c.json({ message: 'Unauthorized.' }, 401);
    const search = c.req.query('search')?.trim();
    const attendances = await prisma.attendance.findMany({
        where: { userId: user.id },
        orderBy: { checkInAt: 'desc' },
        take: 50,
        include: attendanceInclude,
    });
    if (!search)
        return c.json({ attendances });
    const term = search.toLowerCase();
    const dateText = (value) => value
        ? [
            value.toISOString(),
            value.toLocaleDateString('en-US'),
            value.toLocaleTimeString('en-US'),
        ]
        : [];
    const filtered = attendances.filter((attendance) => {
        const status = attendance.checkOutAt
            ? 'work completed completed'
            : 'on working active pending';
        const searchable = [
            attendance.checkInSite.name,
            attendance.checkInSite.location,
            attendance.checkInShift.name,
            attendance.checkInShift.startTime,
            attendance.checkInShift.endTime,
            attendance.checkOutSite?.name ?? '',
            attendance.checkOutShift?.name ?? '',
            status,
            ...dateText(attendance.checkInAt),
            ...dateText(attendance.checkOutAt),
        ]
            .join(' ')
            .toLowerCase();
        return searchable.includes(term);
    });
    return c.json({ attendances: filtered });
})
    .post('/check-in', async (c) => {
    const user = await currentUser(c);
    if (!user)
        return c.json({ message: 'Unauthorized.' }, 401);
    const payload = attendanceActionSchema.safeParse(await c.req.json().catch(() => null));
    if (!payload.success)
        return c.json({ message: 'Select a site, shift, and attendance photo.' }, 400);
    const active = await prisma.attendance.findFirst({
        where: { userId: user.id, checkOutAt: null },
    });
    if (active)
        return c.json({ message: 'You are already checked in.' }, 409);
    const [site, shift] = await Promise.all([
        prisma.site.findFirst({ where: { id: payload.data.siteId, isActive: true } }),
        prisma.shift.findFirst({ where: { id: payload.data.shiftId, isActive: true } }),
    ]);
    if (!site || !shift)
        return c.json({ message: 'The selected site or shift is unavailable.' }, 400);
    const attendance = await prisma.attendance.create({
        data: {
            userId: user.id,
            checkInSiteId: site.id,
            checkInShiftId: shift.id,
            checkInPhotoUrl: payload.data.photoUrl,
            checkInAt: new Date(payload.data.occurredAt),
        },
        include: attendanceInclude,
    });
    return c.json({ attendance }, 201);
})
    .post('/check-out', async (c) => {
    const user = await currentUser(c);
    if (!user)
        return c.json({ message: 'Unauthorized.' }, 401);
    const payload = attendanceActionSchema.safeParse(await c.req.json().catch(() => null));
    if (!payload.success)
        return c.json({ message: 'Select a site, shift, and attendance photo.' }, 400);
    const active = await prisma.attendance.findFirst({
        where: { userId: user.id, checkOutAt: null },
        orderBy: { checkInAt: 'desc' },
    });
    if (!active)
        return c.json({ message: 'No active check-in was found.' }, 404);
    const [site, shift] = await Promise.all([
        prisma.site.findFirst({ where: { id: payload.data.siteId, isActive: true } }),
        prisma.shift.findFirst({ where: { id: payload.data.shiftId, isActive: true } }),
    ]);
    if (!site || !shift)
        return c.json({ message: 'The selected site or shift is unavailable.' }, 400);
    const attendance = await prisma.attendance.update({
        where: { id: active.id },
        data: {
            checkOutSiteId: site.id,
            checkOutShiftId: shift.id,
            checkOutPhotoUrl: payload.data.photoUrl,
            checkOutAt: new Date(payload.data.occurredAt),
        },
        include: attendanceInclude,
    });
    return c.json({ attendance });
});
