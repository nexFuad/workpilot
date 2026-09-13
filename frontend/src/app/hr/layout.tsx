'use client';

import { CalendarDays, LayoutDashboard, LogOut, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { roleDashboardPath } from '@/lib/roles';

const links = [
  { label: 'Dashboard', href: '/hr', icon: LayoutDashboard },
  { label: 'Employees', href: '/hr/employees', icon: UsersRound },
  { label: 'Attendance', href: '/hr/attendance', icon: CalendarDays },
  { label: 'Leave requests', href: '/hr/leave', icon: CalendarDays },
];
export default function HrLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
    else if (user && user.role !== 'hr') router.replace(roleDashboardPath[user.role]);
  }, [isLoading, router, user]);
  function signOut() {
    logout.mutate(undefined, {
      onSuccess: () => {
        toast.success('You have been logged out.');
        router.replace('/');
      },
      onError: () => router.replace('/'),
    });
  }
  if (isLoading || !user || user.role !== 'hr')
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-500">
        Loading your workspace…
      </main>
    );
  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 flex w-18 flex-col border-r border-emerald-100 bg-white p-3 lg:w-64 lg:p-5">
        <Link
          href="/hr"
          className="grid size-10 place-items-center rounded-xl bg-emerald-100 font-bold text-emerald-700 lg:flex lg:w-auto lg:justify-start lg:gap-2 lg:bg-transparent"
        >
          <span className="lg:grid lg:size-9 lg:place-items-center lg:rounded-xl lg:bg-emerald-100">
            HR
          </span>
          <span className="hidden lg:inline">WorkPilot</span>
        </Link>
        <nav className="mt-10 space-y-2">
          {links.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              title={label}
              className={`flex items-center gap-3 rounded-xl p-3 text-sm font-medium lg:px-3 ${pathname === href ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Icon className="size-4 shrink-0" />
              <span className="hidden lg:inline">{label}</span>
            </Link>
          ))}
        </nav>
        <button
          onClick={signOut}
          className="mt-auto flex items-center gap-3 rounded-xl p-3 text-sm font-medium text-slate-600 hover:bg-slate-50 lg:px-3"
        >
          <LogOut className="size-4" />
          <span className="hidden lg:inline">Log out</span>
        </button>
      </aside>
      <main className="min-h-screen pl-18 p-5 sm:p-8 lg:pl-64">{children}</main>
    </div>
  );
}
