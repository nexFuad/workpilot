import { z } from 'zod';

export const payrollSchema = z.object({
  userId: z.string().min(1),
  month: z.string().min(3),
  period: z.string().min(3),
  basic: z.number().int().nonnegative(),
  allowances: z.number().int().nonnegative(),
  bonus: z.number().int().nonnegative(),
  tax: z.number().int().nonnegative(),
  providentFund: z.number().int().nonnegative(),
  status: z.enum(['upcoming', 'paid']),
  paidOn: z.string().optional(),
});

export const payrollStatusSchema = z.object({ status: z.enum(['upcoming', 'paid']) });
