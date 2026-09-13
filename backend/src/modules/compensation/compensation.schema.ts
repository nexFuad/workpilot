import { z } from 'zod';

export const advanceRequestSchema = z.object({
  amount: z.number().int().min(1000).max(300000),
  reason: z.string().trim().min(5).max(500),
  settlementMonth: z.string().trim().min(3).max(80),
});

export const loanRequestSchema = z.object({
  amount: z.number().int().min(10000).max(300000),
  purpose: z.string().trim().min(5).max(500),
  tenure: z.number().int().min(3).max(24),
});

export const reviewSchema = z.object({ status: z.enum(['approved', 'rejected']) });
