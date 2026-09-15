import { z } from 'zod';

export const announcementSchema = z.object({
  title: z.string().trim().min(3).max(160),
  content: z.string().trim().min(5).max(2000),
  priority: z.enum(['normal', 'important', 'urgent']),
  isPinned: z.boolean(),
  isActive: z.boolean(),
});
