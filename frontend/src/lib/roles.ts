import type { UserRole } from '@/types/auth.types';

export const roleDashboardPath: Record<UserRole, string> = {
  admin: '/admin',
  hr: '/hr',
  employee: '/employee',
};
