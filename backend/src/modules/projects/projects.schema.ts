import { z } from 'zod';

export const projectListSchema = z.object({
  status: z.enum(['planned', 'active', 'on_hold', 'completed']).optional(),
});
