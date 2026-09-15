import { z } from 'zod';

export const siteSchema = z.object({
  name: z.string().trim().min(2).max(100),
  location: z.string().trim().min(2).max(200),
  isActive: z.boolean().default(true),
});

export const shiftSchema = z.object({
  name: z.string().trim().min(2).max(100),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  isActive: z.boolean().default(true),
});
