'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { compensationServer } from '@/server/compensation.server';
import type { AdvanceInput, LoanInput } from '@/types/compensation.types';

export function useCompensation() {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: ['compensation'] });
  return {
    salary: useQuery({ queryKey: ['compensation', 'salary'], queryFn: compensationServer.salary }),
    loans: useQuery({ queryKey: ['compensation', 'loans'], queryFn: compensationServer.loans }),
    createAdvance: useMutation({
      mutationFn: (data: AdvanceInput) => compensationServer.createAdvance(data),
      onSuccess: refresh,
    }),
    createLoan: useMutation({
      mutationFn: (data: LoanInput) => compensationServer.createLoan(data),
      onSuccess: refresh,
    }),
  };
}
