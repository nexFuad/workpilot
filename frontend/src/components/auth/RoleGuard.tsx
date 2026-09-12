'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { roleDashboardPath } from '@/lib/roles';
import type { UserRole } from '@/types/auth.types';

export function RoleGuard({ role, children }: { role: UserRole; children: ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
    else if (user && user.role !== role) router.replace(roleDashboardPath[user.role]);
  }, [isLoading, role, router, user]);
  if (isLoading || !user || user.role !== role)
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-500">
        Loading your workspace…
      </main>
    );
  return <>{children}</>;
}
