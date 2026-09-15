import type { Prisma } from '@prisma/client';
import { ApiError } from '../../lib/api-error.js';
import { prisma } from '../../lib/prisma.js';
import type { z } from 'zod';
import { attendanceActionSchema } from './attendance.schema.js';

type AttendanceActionInput = z.infer<typeof attendanceActionSchema>;

const attendanceInclude = {
  checkInSite: true,
  checkInShift: true,
  checkOutSite: true,
  checkOutShift: true,
} as const;

export async function listAttendanceOptions() {
  const [sites, shifts] = await Promise.all([
    prisma.site.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    prisma.shift.findMany({ where: { isActive: true }, orderBy: { startTime: 'asc' } }),
  ]);
  return { sites, shifts };
}

export function findCurrentAttendance(userId: string) {
  return prisma.attendance.findFirst({
    where: { userId, checkOutAt: null },
    orderBy: { checkInAt: 'desc' },
    include: attendanceInclude,
  });
}

export function listAttendanceHistory(userId: string, search = '') {
  const term = search.toLowerCase();
  const dateMatch = term.match(/^\d{4}-\d{2}-\d{2}$/);
  const dateStart = dateMatch ? new Date(`${term}T00:00:00.000Z`) : null;
  const dateEnd = dateMatch ? new Date(`${term}T23:59:59.999Z`) : null;
  const statusCondition = ['working', 'active', 'pending'].some((value) => value.includes(term))
    ? { checkOutAt: null }
    : ['completed', 'complete'].some((value) => value.includes(term))
      ? { checkOutAt: { not: null } }
      : null;
  const where: Prisma.AttendanceWhereInput = {
    userId,
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
  return prisma.attendance.findMany({
    where,
    orderBy: { checkInAt: 'desc' },
    take: 50,
    include: attendanceInclude,
  });
}

async function validateWorkplace(siteId: string, shiftId: string) {
  const [site, shift] = await Promise.all([
    prisma.site.findFirst({ where: { id: siteId, isActive: true } }),
    prisma.shift.findFirst({ where: { id: shiftId, isActive: true } }),
  ]);
  if (!site || !shift) {
    throw new ApiError(400, 'The selected site or shift is unavailable.');
  }
  return { site, shift };
}

export async function checkIn(userId: string, input: AttendanceActionInput) {
  const active = await prisma.attendance.findFirst({ where: { userId, checkOutAt: null } });
  if (active) throw new ApiError(409, 'You are already checked in.');
  const { site, shift } = await validateWorkplace(input.siteId, input.shiftId);
  return prisma.attendance.create({
    data: {
      userId,
      checkInSiteId: site.id,
      checkInShiftId: shift.id,
      checkInPhotoUrl: input.photoUrl,
      checkInAt: new Date(input.occurredAt),
    },
    include: attendanceInclude,
  });
}

export async function checkOut(userId: string, input: AttendanceActionInput) {
  const active = await prisma.attendance.findFirst({
    where: { userId, checkOutAt: null },
    orderBy: { checkInAt: 'desc' },
  });
  if (!active) throw new ApiError(404, 'No active check-in was found.');
  const { site, shift } = await validateWorkplace(input.siteId, input.shiftId);
  return prisma.attendance.update({
    where: { id: active.id },
    data: {
      checkOutSiteId: site.id,
      checkOutShiftId: shift.id,
      checkOutPhotoUrl: input.photoUrl,
      checkOutAt: new Date(input.occurredAt),
    },
    include: attendanceInclude,
  });
}
