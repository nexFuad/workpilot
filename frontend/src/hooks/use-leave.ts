'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { leaveServer } from '@/server/leave.server';
import type { LeaveRequestInput } from '@/types/leave.types';

const keys = { requests: ['leave', 'requests'] } as const;

export function useLeave(search = '') {
  const queryClient = useQueryClient();
  const requests = useQuery({
    queryKey: [...keys.requests, search],
    queryFn: () => leaveServer.list(search),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: keys.requests });
  const create = useMutation({ mutationFn: leaveServer.create, onSuccess: refresh });
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: LeaveRequestInput }) =>
      leaveServer.update(id, data),
    onSuccess: refresh,
  });
  const remove = useMutation({ mutationFn: leaveServer.remove, onSuccess: refresh });
  return { requests, create, update, remove };
}
