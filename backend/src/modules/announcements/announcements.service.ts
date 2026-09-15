import type { Prisma } from '@prisma/client';
import { ApiError } from '../../lib/api-error.js';
import { prisma } from '../../lib/prisma.js';

export async function listAnnouncements(userId: string, search = '') {
  const visibleWhere: Prisma.AnnouncementWhereInput = { isActive: true };
  const where: Prisma.AnnouncementWhereInput = {
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
        reads: { where: { userId }, select: { readAt: true }, take: 1 },
      },
    }),
    prisma.announcement.count({ where: visibleWhere }),
    prisma.announcementRead.count({
      where: { userId, announcement: { is: visibleWhere } },
    }),
  ]);
  return {
    announcements: announcements.map(({ reads, ...announcement }) => ({
      ...announcement,
      isRead: reads.length > 0,
      readAt: reads[0]?.readAt ?? null,
    })),
    summary: { total, unread: Math.max(total - read, 0) },
  };
}

export async function markAnnouncementRead(id: string, userId: string) {
  const announcement = await prisma.announcement.findFirst({
    where: { id, isActive: true },
    select: { id: true },
  });
  if (!announcement) throw new ApiError(404, 'Announcement not found.');
  return prisma.announcementRead.upsert({
    where: { userId_announcementId: { userId, announcementId: announcement.id } },
    create: { userId, announcementId: announcement.id },
    update: {},
  });
}
