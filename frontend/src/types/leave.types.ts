import { z } from 'zod';

export const leaveSchema = z
  .object({
    leaveType: z.string().min(2, 'Choose a leave type'),
    reason: z.string().min(5, 'Write a short reason'),
    startDate: z.string().min(1, 'Choose a start date'),
    endDate: z.string().min(1, 'Choose an end date'),
  })
  .refine((data) => !data.startDate || !data.endDate || data.endDate >= data.startDate, {
    path: ['endDate'],
    message: 'End date must be on or after the start date.',
  });

export type LeaveRequestInput = {
  leaveType: string;
  reason: string;
  startDate: string;
  endDate: string;
};

export type LeaveRequest = LeaveRequestInput & {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
};
