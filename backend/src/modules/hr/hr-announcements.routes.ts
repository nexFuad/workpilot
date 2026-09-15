import { getCookie } from 'hono/cookie';
import { Hono, type Context } from 'hono';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { getCurrentUser } from '../auth/auth.service.js';

const announcementSchema = z.object({
  title: z.string().trim().min(3).max(160),
  content: z.string().trim().min(5).max(2000),
  priority: z.enum(['normal', 'important', 'urgent']),
  isPinned: z.boolean(),
  isActive: z.boolean(),
});

async function authorizeHr(c: Context) {
  try {
    const user = await getCurrentUser(getCookie(c, 'workpilot_access') ?? '');
    return user.role === 'hr' ? user : null;
  } catch {
    return null;
  }
}

export const hrAnnouncementsRoutes = new Hono()
  .get('/', async (c) => {
    if (!(await authorizeHr(c))) return c.json({ message: 'Unauthorized.' }, 403);

    const page = Math.max(Number.parseInt(c.req.query('page') ?? '0', 10) || 0, 0);
    const limit = Math.min(Math.max(Number.parseInt(c.req.query('limit') ?? '6', 10) || 6, 1), 20);
    const skip = page * limit;
    const search = c.req.query('search')?.trim();
    const where: Prisma.AnnouncementWhereInput = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [items, total, active, pinned] = await Promise.all([
      prisma.announcement.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.announcement.count({ where }),
      prisma.announcement.count({ where: { AND: [where, { isActive: true }] } }),
      prisma.announcement.count({ where: { AND: [where, { isPinned: true }] } }),
    ]);

    return c.json({
      announcements: items,
      total,
      summary: { active, pinned },
      nextPage: skip + items.length < total ? page + 1 : null,
    });
  })
  .post('/', async (c) => {
    if (!(await authorizeHr(c))) return c.json({ message: 'Unauthorized.' }, 403);

    const result = announcementSchema.safeParse(await c.req.json().catch(() => null));
    if (!result.success) {
      return c.json({ message: 'Please provide valid announcement details.' }, 400);
    }

    const announcement = await prisma.announcement.create({ data: result.data });
    return c.json({ announcement }, 201);
  })
  .patch('/:id', async (c) => {
    if (!(await authorizeHr(c))) return c.json({ message: 'Unauthorized.' }, 403);

    const result = announcementSchema.safeParse(await c.req.json().catch(() => null));
    if (!result.success) {
      return c.json({ message: 'Please provide valid announcement details.' }, 400);
    }

    const announcement = await prisma.announcement
      .update({ where: { id: c.req.param('id') }, data: result.data })
      .catch(() => null);

    return announcement
      ? c.json({ announcement })
      : c.json({ message: 'Announcement not found.' }, 404);
  })
  .delete('/:id', async (c) => {
    if (!(await authorizeHr(c))) return c.json({ message: 'Unauthorized.' }, 403);

    const announcement = await prisma.announcement
      .delete({ where: { id: c.req.param('id') } })
      .catch(() => null);

    return announcement
      ? c.json({ message: 'Announcement deleted.' })
      : c.json({ message: 'Announcement not found.' }, 404);
  });
