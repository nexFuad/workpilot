'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { roleDashboardPath } from '@/lib/roles';

export function LandingRouteRedirect() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  useEffect(() => {
    if (isLoading) return;
    router.replace(user ? roleDashboardPath[user.role] : '/');
  }, [isLoading, router, user]);
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-500">
      Redirecting…
    </main>
  );
}
