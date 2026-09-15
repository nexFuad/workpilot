import { getCookie } from 'hono/cookie';
import { Hono } from 'hono';
import { prisma } from '../../lib/prisma.js';
import { getCurrentUser } from '../auth/auth.service.js';
async function currentUser(c) {
    try {
        return await getCurrentUser(getCookie(c, 'workpilot_access') ?? '');
    }
    catch {
        return null;
    }
}
export const announcementRoutes = new Hono()
    .get('/', async (c) => {
    const user = await currentUser(c);
    if (!user)
        return c.json({ message: 'Unauthorized.' }, 401);
    const search = c.req.query('search')?.trim();
    const visibleWhere = { isActive: true };
    const where = {
        ...visibleWhere,
        ...(search
            ? {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { content: { contains: search, mode: 'insensitive' } },
                    { priority: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {}),
    };
    const [announcements, total, read] = await Promise.all([
        prisma.announcement.findMany({
            where,
            orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
            include: {
                reads: {
                    where: { userId: user.id },
                    select: { readAt: true },
                    take: 1,
                },
            },
        }),
        prisma.announcement.count({ where: visibleWhere }),
        prisma.announcementRead.count({
            where: { userId: user.id, announcement: { is: visibleWhere } },
        }),
    ]);
    const items = announcements.map(({ reads, ...announcement }) => ({
        ...announcement,
        isRead: reads.length > 0,
        readAt: reads[0]?.readAt ?? null,
    }));
    return c.json({
        announcements: items,
        summary: {
            total,
            unread: Math.max(total - read, 0),
        },
    });
})
    .post('/:id/read', async (c) => {
    const user = await currentUser(c);
    if (!user)
        return c.json({ message: 'Unauthorized.' }, 401);
    const announcement = await prisma.announcement.findFirst({
        where: { id: c.req.param('id'), isActive: true },
        select: { id: true },
    });
    if (!announcement)
        return c.json({ message: 'Announcement not found.' }, 404);
    const receipt = await prisma.announcementRead.upsert({
        where: {
            userId_announcementId: {
                userId: user.id,
                announcementId: announcement.id,
            },
        },
        create: { userId: user.id, announcementId: announcement.id },
        update: {},
    });
    return c.json({ readAt: receipt.readAt });
});
