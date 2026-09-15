import { z } from 'zod';

export const taskSchema = z.object({
  userId: z.string().min(1),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(1200).optional().default(''),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['todo', 'in_progress', 'completed']),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .or(z.literal(''))
    .optional()
    .default(''),
});
