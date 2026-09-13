import { z } from 'zod';
export const leaveRequestSchema = z
    .object({
    leaveType: z.string().min(2).max(60),
    reason: z.string().min(5).max(500),
    startDate: z.string().date(),
    endDate: z.string().date(),
})
    .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be on or after the start date.',
    path: ['endDate'],
});
