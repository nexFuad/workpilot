'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attendanceServer } from '@/server/attendance.server';
import type { AttendanceAction } from '@/types/attendance.types';

const keys = {
  options: ['attendance', 'options'],
  current: ['attendance', 'current'],
  history: ['attendance', 'history'],
} as const;
export function useAttendance() {
  const queryClient = useQueryClient();
  const options = useQuery({ queryKey: keys.options, queryFn: attendanceServer.options });
  const current = useQuery({ queryKey: keys.current, queryFn: attendanceServer.current });
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: keys.current }),
      queryClient.invalidateQueries({ queryKey: keys.history }),
    ]);
  const checkIn = useMutation({
    mutationFn: (data: AttendanceAction) => attendanceServer.checkIn(data),
    onSuccess: refresh,
  });
  const checkOut = useMutation({
    mutationFn: (data: AttendanceAction) => attendanceServer.checkOut(data),
    onSuccess: refresh,
  });
  return { options, current, checkIn, checkOut };
}
