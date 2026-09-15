import type { Prisma } from '@prisma/client';
import type { z } from 'zod';
import { ApiError } from '../../lib/api-error.js';
import { pagination, type ListQuery } from '../../lib/list-query.js';
import { prisma } from '../../lib/prisma.js';
import { isPrismaError } from '../../lib/prisma-error.js';
import { shiftSchema, siteSchema } from './hr-settings.schema.js';

type SiteInput = z.infer<typeof siteSchema>;
type ShiftInput = z.infer<typeof shiftSchema>;

export async function listSites(query: ListQuery) {
  const where: Prisma.SiteWhereInput = query.search
    ? {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { location: { contains: query.search, mode: 'insensitive' } },
        ],
      }
    : {};
  const [sites, total] = await Promise.all([
    prisma.site.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: query.skip,
      take: query.limit,
    }),
    prisma.site.count({ where }),
  ]);
  return { sites, pagination: pagination(total, query.page, query.limit) };
}

export async function createSite(input: SiteInput) {
  try {
    return await prisma.site.create({ data: input });
  } catch (error) {
    if (isPrismaError(error, 'P2002')) {
      throw new ApiError(409, 'A site with this name already exists.');
    }
    throw error;
  }
}

export async function updateSite(id: string, input: SiteInput) {
  try {
    return await prisma.site.update({ where: { id }, data: input });
  } catch (error) {
    if (isPrismaError(error, 'P2025')) throw new ApiError(404, 'Site not found.');
    if (isPrismaError(error, 'P2002')) {
      throw new ApiError(409, 'A site with this name already exists.');
    }
    throw error;
  }
}

export async function deleteSite(id: string) {
  try {
    await prisma.site.delete({ where: { id } });
  } catch (error) {
    if (isPrismaError(error, 'P2025')) throw new ApiError(404, 'Site not found.');
    if (isPrismaError(error, 'P2003')) {
      throw new ApiError(409, 'Site cannot be deleted because it is in use.');
    }
    throw error;
  }
}

export async function listShifts(query: ListQuery) {
  const where: Prisma.ShiftWhereInput = query.search
    ? {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { startTime: { contains: query.search, mode: 'insensitive' } },
          { endTime: { contains: query.search, mode: 'insensitive' } },
        ],
      }
    : {};
  const [shifts, total] = await Promise.all([
    prisma.shift.findMany({
      where,
      orderBy: { startTime: 'asc' },
      skip: query.skip,
      take: query.limit,
    }),
    prisma.shift.count({ where }),
  ]);
  return { shifts, pagination: pagination(total, query.page, query.limit) };
}

export async function createShift(input: ShiftInput) {
  try {
    return await prisma.shift.create({ data: input });
  } catch (error) {
    if (isPrismaError(error, 'P2002')) {
      throw new ApiError(409, 'A shift with this name already exists.');
    }
    throw error;
  }
}

export async function updateShift(id: string, input: ShiftInput) {
  try {
    return await prisma.shift.update({ where: { id }, data: input });
  } catch (error) {
    if (isPrismaError(error, 'P2025')) throw new ApiError(404, 'Shift not found.');
    if (isPrismaError(error, 'P2002')) {
      throw new ApiError(409, 'A shift with this name already exists.');
    }
    throw error;
  }
}

export async function deleteShift(id: string) {
  try {
    await prisma.shift.delete({ where: { id } });
  } catch (error) {
    if (isPrismaError(error, 'P2025')) throw new ApiError(404, 'Shift not found.');
    if (isPrismaError(error, 'P2003')) {
      throw new ApiError(409, 'Shift cannot be deleted because it is in use.');
    }
    throw error;
  }
}
