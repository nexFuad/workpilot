'use client';

import {
  CalendarDays,
  FileText,
  FolderKanban,
  HandCoins,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Megaphone,
  MoreHorizontal,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { roleDashboardPath } from '@/lib/roles';

const links = [
  { label: 'Overview', href: '/employee', icon: LayoutDashboard },
  { label: 'My Attendance', href: '/employee/attendance', icon: CalendarDays },
  { label: 'Leave', href: '/employee/leave', icon: CalendarDays },
  { label: 'Salary', href: '/employee/salary', icon: WalletCards },
  { label: 'Loans', href: '/employee/loans', icon: HandCoins },
  { label: 'My Tasks', href: '/employee/tasks', icon: ListTodo },
  { label: 'Projects', href: '/employee/projects', icon: FolderKanban },
  { label: 'Documents', href: '/employee/documents', icon: FileText },
  { label: 'Announcements', href: '/employee/announcements', icon: Megaphone },
  { label: 'My Account', href: '/employee/account', icon: UserRound },
];

export default function EmployeeLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
    else if (user && user.role !== 'employee') router.replace(roleDashboardPath[user.role]);
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
  if (isLoading || !user || user.role !== 'employee')
    return (
      <main
        className="min-h-screen animate-pulse bg-slate-50 p-4 sm:p-6 lg:p-8"
        aria-label="Loading workspace"
      >
        <span className="block h-8 w-56 rounded bg-slate-200" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <span key={index} className="h-32 rounded-2xl bg-white shadow-sm" />
          ))}
        </div>
        <div className="mt-6 h-96 rounded-2xl bg-white shadow-sm" />
      </main>
    );
  const mobileLinks = links.slice(0, 3);
  const extraLinks = links.slice(3);
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <main className="w-full p-4 sm:p-6 lg:p-8">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-sky-100 bg-white/95 px-2 py-2 backdrop-blur">
        <div className="flex w-full items-center justify-around">
          <div className="hidden w-full items-center justify-around lg:flex">
            {links.map(({ label, href, icon: Icon }) => (
              <Link
                href={href}
                key={href}
                className={`flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium ${pathname === href ? 'text-sky-700' : 'text-slate-500'}`}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            ))}
            <button
              onClick={signOut}
              disabled={logout.isPending}
              className="flex min-w-18 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-rose-600 disabled:opacity-60"
            >
              <LogOut className="size-5" />
              Logout
            </button>
          </div>
          <div className="flex w-full items-center justify-around lg:hidden">
            {mobileLinks.map(({ label, href, icon: Icon }) => (
              <Link
                href={href}
                key={href}
                className={`flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium ${pathname === href ? 'text-sky-700' : 'text-slate-500'}`}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            ))}
            <button
              onClick={() => setMoreOpen((open) => !open)}
              className="flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500"
            >
              <MoreHorizontal className="size-5" />
              More
            </button>
          </div>
        </div>
      </nav>
      {moreOpen && (
        <>
          <button
            aria-label="Close extra navigation"
            onClick={() => setMoreOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/10"
          />
          <section className="fixed bottom-18 right-3 z-50 w-56 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-300/40">
            <div className="mb-2 flex items-center justify-between px-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                More pages
              </span>
              <button
                onClick={() => setMoreOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-1 text-slate-500"
              >
                <X className="size-4" />
              </button>
            </div>
            {extraLinks.map(({ label, href, icon: Icon }) => (
              <Link
                href={href}
                onClick={() => setMoreOpen(false)}
                key={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${pathname === href ? 'bg-sky-50 text-sky-700' : 'text-slate-600'}`}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
            <button
              onClick={signOut}
              className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600"
            >
              <LogOut className="size-4" />
              Log out
            </button>
          </section>
        </>
      )}
    </div>
  );
}
