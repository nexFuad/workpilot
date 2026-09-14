'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hrLeaveServer } from '@/server/hr-leave.server';
export function useHrLeave() {
  const c = useQueryClient();
  const refresh = () => c.invalidateQueries({ queryKey: ['hr', 'leaves'] });
  return {
    requests: useQuery({ queryKey: ['hr', 'leaves'], queryFn: hrLeaveServer.list }),
    review: useMutation({
      mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) =>
        hrLeaveServer.updateStatus(id, status),
      onSuccess: refresh,
    }),
  };
}
