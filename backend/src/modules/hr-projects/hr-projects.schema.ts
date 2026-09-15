import { z } from 'zod';

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .or(z.literal(''));

export const projectSchema = z
  .object({
    name: z.string().trim().min(3).max(160),
    description: z.string().trim().max(2000).optional().default(''),
    status: z.enum(['planned', 'active', 'on_hold', 'completed']),
    progress: z.number().int().min(0).max(100),
    startDate: dateSchema.optional().default(''),
    endDate: dateSchema.optional().default(''),
    assignments: z
      .array(
        z.object({
          userId: z.string().min(1),
          role: z.string().trim().min(2).max(80),
        }),
      )
      .min(1)
      .max(50),
  })
  .superRefine((data, context) => {
    if (new Set(data.assignments.map((item) => item.userId)).size !== data.assignments.length) {
      context.addIssue({ code: 'custom', message: 'Each employee can only be assigned once.' });
    }
    if (data.startDate && data.endDate && data.startDate > data.endDate) {
      context.addIssue({ code: 'custom', message: 'End date must be after the start date.' });
    }
  });
