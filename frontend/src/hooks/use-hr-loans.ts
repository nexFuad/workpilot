'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hrLoansServer } from '@/server/hr-loans.server';
export function useHrLoans() {
  const c = useQueryClient();
  const refresh = () => c.invalidateQueries({ queryKey: ['hr', 'loans'] });
  return {
    requests: useQuery({ queryKey: ['hr', 'loans'], queryFn: hrLoansServer.list }),
    review: useMutation({
      mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) =>
        hrLoansServer.review(id, status),
      onSuccess: refresh,
    }),
  };
}
