'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { roleDashboardPath } from '@/lib/roles';

export function AuthRedirect() {
  const router = useRouter();
  const { user } = useAuth();
  useEffect(() => {
    if (user) router.replace(roleDashboardPath[user.role]);
  }, [router, user]);
  return null;
}
