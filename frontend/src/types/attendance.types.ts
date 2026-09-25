import { z } from 'zod';

export const attendanceSchema = z.object({
  siteId: z.string().min(1, 'Select a site'),
  shiftId: z.string().min(1, 'Select a shift'),
  occurredTime: z.string().min(1, 'Choose a time'),
  photo: z.custom<File>().refine(Boolean, 'Take a live photo to continue'),
});
export type AttendanceFormValues = z.infer<typeof attendanceSchema>;

export type Site = { id: string; name: string; location: string };
export type Shift = { id: string; name: string; startTime: string; endTime: string };
export type Attendance = {
  id: string;
  checkInAt: string;
  checkInPhotoUrl: string;
  checkOutAt: string | null;
  checkOutPhotoUrl: string | null;
  checkInSite: Site;
  checkInShift: Shift;
  checkOutSite: Site | null;
  checkOutShift: Shift | null;
};
export type AttendanceAction = {
  siteId: string;
  shiftId: string;
  photoUrl: string;
  occurredAt: string;
};
