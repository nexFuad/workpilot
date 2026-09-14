'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hrPayrollServer, type PayrollInput } from '@/server/hr-payroll.server';
export function useHrPayroll() {
  const c = useQueryClient();
  const refresh = () => c.invalidateQueries({ queryKey: ['hr', 'payroll'] });
  return {
    data: useQuery({ queryKey: ['hr', 'payroll'], queryFn: hrPayrollServer.list }),
    save: useMutation({
      mutationFn: (x: PayrollInput) => hrPayrollServer.save(x),
      onSuccess: refresh,
    }),
    generate: useMutation({ mutationFn: hrPayrollServer.generate, onSuccess: refresh }),
  };
}
