import type { UserRole } from '@/types/auth.types';

export const roleDashboardPath: Record<UserRole, string> = {
  hr: '/hr',
  employee: '/employee',
};
