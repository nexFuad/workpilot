import { getCookie } from 'hono/cookie';
import { Hono, type Context } from 'hono';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { attendanceActionSchema } from './attendance.schema.js';

async function currentUser(c: Context) {
  try {
    return await getCurrentUser(getCookie(c, 'workpilot_access') ?? '');
  } catch {
    return null;
  }
}

const attendanceInclude = {
  checkInSite: true,
  checkInShift: true,
  checkOutSite: true,
  checkOutShift: true,
} as const;

export const attendanceRoutes = new Hono()
  .get('/options', async (c) => {
    const user = await currentUser(c);
    if (!user) return c.json({ message: 'Unauthorized.' }, 401);
    const [sites, shifts] = await Promise.all([
      prisma.site.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
      prisma.shift.findMany({ where: { isActive: true }, orderBy: { startTime: 'asc' } }),
    ]);
    return c.json({ sites, shifts });
  })
  .get('/current', async (c) => {
    const user = await currentUser(c);
    if (!user) return c.json({ message: 'Unauthorized.' }, 401);
    const attendance = await prisma.attendance.findFirst({
      where: { userId: user.id, checkOutAt: null },
      orderBy: { checkInAt: 'desc' },
      include: attendanceInclude,
    });
    return c.json({ attendance });
  })
  .get('/history', async (c) => {
    const user = await currentUser(c);
    if (!user) return c.json({ message: 'Unauthorized.' }, 401);
    const search = c.req.query('search')?.trim();
    const term = search?.toLowerCase() ?? '';
    const dateMatch = term.match(/^\d{4}-\d{2}-\d{2}$/);
    const dateStart = dateMatch ? new Date(`${term}T00:00:00.000Z`) : null;
    const dateEnd = dateMatch ? new Date(`${term}T23:59:59.999Z`) : null;
    const statusCondition = ['working', 'active', 'pending'].some((value) => value.includes(term))
      ? { checkOutAt: null }
      : ['completed', 'complete'].some((value) => value.includes(term))
        ? { checkOutAt: { not: null } }
        : null;
    const where: Prisma.AttendanceWhereInput = {
      userId: user.id,
      ...(search
        ? {
            OR: [
              { checkInSite: { is: { name: { contains: search, mode: 'insensitive' } } } },
              { checkInSite: { is: { location: { contains: search, mode: 'insensitive' } } } },
              { checkInShift: { is: { name: { contains: search, mode: 'insensitive' } } } },
              { checkInShift: { is: { startTime: { contains: search, mode: 'insensitive' } } } },
              { checkInShift: { is: { endTime: { contains: search, mode: 'insensitive' } } } },
              { checkOutSite: { is: { name: { contains: search, mode: 'insensitive' } } } },
              { checkOutShift: { is: { name: { contains: search, mode: 'insensitive' } } } },
              ...(statusCondition ? [statusCondition] : []),
              ...(dateStart && dateEnd ? [{ checkInAt: { gte: dateStart, lte: dateEnd } }] : []),
            ],
          }
        : {}),
    };
    const attendances = await prisma.attendance.findMany({
      where,
      orderBy: { checkInAt: 'desc' },
      take: 50,
      include: attendanceInclude,
    });
    return c.json({ attendances });
  })
  .post('/check-in', async (c) => {
    const user = await currentUser(c);
    if (!user) return c.json({ message: 'Unauthorized.' }, 401);
    const payload = attendanceActionSchema.safeParse(await c.req.json().catch(() => null));
    if (!payload.success)
      return c.json({ message: 'Select a site, shift, and attendance photo.' }, 400);
    const active = await prisma.attendance.findFirst({
      where: { userId: user.id, checkOutAt: null },
    });
    if (active) return c.json({ message: 'You are already checked in.' }, 409);
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
    if (!user) return c.json({ message: 'Unauthorized.' }, 401);
    const payload = attendanceActionSchema.safeParse(await c.req.json().catch(() => null));
    if (!payload.success)
      return c.json({ message: 'Select a site, shift, and attendance photo.' }, 400);
    const active = await prisma.attendance.findFirst({
      where: { userId: user.id, checkOutAt: null },
      orderBy: { checkInAt: 'desc' },
    });
    if (!active) return c.json({ message: 'No active check-in was found.' }, 404);
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
