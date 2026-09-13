import { apiRequest } from './auth.server';
import type { Attendance, AttendanceAction, Shift, Site } from '@/types/attendance.types';

export const attendanceServer = {
  options: () => apiRequest<{ sites: Site[]; shifts: Shift[] }>('/api/attendance/options'),
  current: () => apiRequest<{ attendance: Attendance | null }>('/api/attendance/current'),
  history: (search = '') =>
    apiRequest<{ attendances: Attendance[] }>(
      `/api/attendance/history?search=${encodeURIComponent(search)}`,
    ),
  checkIn: (data: AttendanceAction) =>
    apiRequest<{ attendance: Attendance }>('/api/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  checkOut: (data: AttendanceAction) =>
    apiRequest<{ attendance: Attendance }>('/api/attendance/check-out', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
