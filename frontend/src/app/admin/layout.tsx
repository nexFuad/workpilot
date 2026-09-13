'use client';

import { BarChart3, Building2, LayoutDashboard, LogOut, Menu, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { roleDashboardPath } from '@/lib/roles';

const links = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Departments', href: '/admin/departments', icon: Building2 },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
    else if (user && user.role !== 'admin') router.replace(roleDashboardPath[user.role]);
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
  if (isLoading || !user || user.role !== 'admin')
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-500">
        Loading your workspace…
      </main>
    );
  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-indigo-100 bg-white p-5 lg:block">
        <Link href="/admin" className="flex items-center gap-2 font-bold text-indigo-700">
          <span className="grid size-9 place-items-center rounded-xl bg-indigo-100">
            <Menu className="size-4" />
          </span>
          WorkPilot
        </Link>
        <p className="mt-10 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Administrator
        </p>
        <nav className="mt-3 space-y-1">
          {links.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${pathname === href ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
          <Link href="/admin" className="font-bold text-indigo-700 lg:hidden">
            WorkPilot
          </Link>
          <p className="hidden text-sm text-slate-500 lg:block">Admin workspace</p>
          <button
            onClick={signOut}
            disabled={logout.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </header>
        <main className="p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
