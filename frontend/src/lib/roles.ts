import type { UserRole } from '@/types/auth.types';

export const roleDashboardPath: Record<UserRole, string> = {
  admin: '/admin/dashboard',
  hr: '/hr/dashboard',
  employee: '/employee/dashboard',
};
