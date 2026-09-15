import type { Prisma } from '@prisma/client';
import type { z } from 'zod';
import { ApiError } from '../../lib/api-error.js';
import { prisma } from '../../lib/prisma.js';
import { announcementSchema } from './hr-announcements.schema.js';

type AnnouncementInput = z.infer<typeof announcementSchema>;

export async function listAnnouncements(page: number, limit: number, search = '') {
  const skip = page * limit;
  const where: Prisma.AnnouncementWhereInput = search
    ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};
  const [announcements, total, active, pinned] = await Promise.all([
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
  return {
    announcements,
    total,
    summary: { active, pinned },
    nextPage: skip + announcements.length < total ? page + 1 : null,
  };
}

export function createAnnouncement(input: AnnouncementInput) {
  return prisma.announcement.create({ data: input });
}

export async function updateAnnouncement(id: string, input: AnnouncementInput) {
  const exists = await prisma.announcement.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw new ApiError(404, 'Announcement not found.');
  return prisma.announcement.update({ where: { id }, data: input });
}

export async function deleteAnnouncement(id: string) {
  const exists = await prisma.announcement.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw new ApiError(404, 'Announcement not found.');
  await prisma.announcement.delete({ where: { id } });
}
