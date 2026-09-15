import type { Prisma } from '@prisma/client';
import { ApiError } from '../../lib/api-error.js';
import { pagination, type ListQuery } from '../../lib/list-query.js';
import { prisma } from '../../lib/prisma.js';
import type { z } from 'zod';
import { documentReviewSchema, documentSchema } from './documents.schema.js';

type DocumentInput = z.infer<typeof documentSchema>;
type DocumentReviewInput = z.infer<typeof documentReviewSchema>;

export function listDocuments(userId: string, search = '') {
  const where: Prisma.EmployeeDocumentWhereInput = {
    userId,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { fileType: { contains: search, mode: 'insensitive' } },
            { status: { contains: search, mode: 'insensitive' } },
            { reviewerNote: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
  return prisma.employeeDocument.findMany({ where, orderBy: { createdAt: 'desc' } });
}

export function createDocument(userId: string, input: DocumentInput) {
  return prisma.employeeDocument.create({ data: { ...input, userId } });
}

export async function listDocumentsForReview(query: ListQuery) {
  const status = ['pending', 'approved', 'rejected'].includes(query.status ?? '')
    ? query.status
    : undefined;
  const where: Prisma.EmployeeDocumentWhereInput = {
    ...(status ? { status } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { fileType: { contains: query.search, mode: 'insensitive' } },
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
          ],
        }
      : {}),
  };
  const [documents, total] = await Promise.all([
    prisma.employeeDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: query.skip,
      take: query.limit,
      include: { user: { select: { employeeId: true, fullName: true, companyName: true } } },
    }),
    prisma.employeeDocument.count({ where }),
  ]);
  return { documents, pagination: pagination(total, query.page, query.limit) };
}

export async function reviewDocument(id: string, input: DocumentReviewInput) {
  const existing = await prisma.employeeDocument.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) throw new ApiError(404, 'Document not found.');
  return prisma.employeeDocument.update({
    where: { id },
    data: { ...input, reviewedAt: new Date() },
  });
}

export async function deleteDocument(id: string) {
  const existing = await prisma.employeeDocument.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) throw new ApiError(404, 'Document not found.');
  await prisma.employeeDocument.delete({ where: { id } });
}
