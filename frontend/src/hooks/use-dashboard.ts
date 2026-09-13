'use client';
import { useQuery } from '@tanstack/react-query';
import { dashboardServer } from '@/server/dashboard.server';
export function useEmployeeDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'employee'],
    queryFn: dashboardServer.employee,
    refetchInterval: 60000,
  });
}
