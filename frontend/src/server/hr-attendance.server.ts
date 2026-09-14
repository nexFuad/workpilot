import { apiRequest } from './auth.server';
export type HrAttendanceRow = {
  employee: {
    id: string;
    employeeId: string;
    fullName: string | null;
    companyName: string;
    profileImage: string | null;
  };
  status: string;
  attendance: {
    checkInAt: string;
    checkOutAt: string | null;
    checkInPhotoUrl: string;
    checkOutPhotoUrl: string | null;
    checkInSite: { name: string };
    checkInShift: { name: string; startTime: string; endTime: string };
  } | null;
  lateMinutes: number;
  overtimeMinutes: number;
};
export type HrAttendanceData = {
  date: string;
  attendance: HrAttendanceRow[];
  summary: { total: number; present: number; absent: number; late: number; overtime: number };
};
export const hrAttendanceServer = {
  list: (date: string) => apiRequest<HrAttendanceData>(`/api/hr/attendance?date=${date}`),
};
