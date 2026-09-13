import { z } from 'zod';
export const taskStatusSchema = z.object({ status: z.enum(['todo', 'in_progress', 'completed']) });
