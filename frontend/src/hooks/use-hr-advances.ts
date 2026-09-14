'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hrAdvancesServer } from '@/server/hr-advances.server';
export function useHrAdvances() {
  const c = useQueryClient();
  const refresh = () => c.invalidateQueries({ queryKey: ['hr', 'advances'] });
  return {
    requests: useQuery({ queryKey: ['hr', 'advances'], queryFn: hrAdvancesServer.list }),
    review: useMutation({
      mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) =>
        hrAdvancesServer.review(id, status),
      onSuccess: refresh,
    }),
  };
}
