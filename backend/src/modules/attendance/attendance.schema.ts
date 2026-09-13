import { z } from 'zod';

export const attendanceActionSchema = z.object({
  siteId: z.string().cuid(),
  shiftId: z.string().cuid(),
  photoUrl: z.string().url(),
  occurredAt: z.string().datetime(),
});
