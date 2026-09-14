'use client';
import { useQuery } from '@tanstack/react-query';
import { hrAttendanceServer } from '@/server/hr-attendance.server';
export function useHrAttendance(date: string) {
  return useQuery({
    queryKey: ['hr', 'attendance', date],
    queryFn: () => hrAttendanceServer.list(date),
  });
}
