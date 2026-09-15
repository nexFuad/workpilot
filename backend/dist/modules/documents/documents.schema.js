import { z } from 'zod';
export const documentSchema = z.object({
    name: z.string().trim().min(1).max(160),
    fileUrl: z.string().url(),
    fileType: z.string().trim().min(2).max(100),
    size: z
        .number()
        .int()
        .positive()
        .max(10 * 1024 * 1024),
});
export const documentReviewSchema = z.object({
    status: z.enum(['approved', 'rejected']),
    reviewerNote: z.string().trim().max(500).optional(),
});
