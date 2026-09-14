'use client';

import {
  BellRing,
  CalendarDays,
  ClipboardCheck,
  FileText,
  HandCoins,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  ReceiptText,
  Settings2,
  UsersRound,
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
  { label: 'Dashboard', href: '/hr', icon: LayoutDashboard },
  { label: 'Employees', href: '/hr/employees', icon: UsersRound },
  { label: 'Assign tasks', href: '/hr/tasks', icon: ClipboardCheck },
  { label: 'Attendance', href: '/hr/attendance', icon: CalendarDays },
  { label: 'Leave requests', href: '/hr/leave', icon: CalendarDays },
  { label: 'Payroll & salary', href: '/hr/payroll', icon: WalletCards },
  { label: 'Salary advances', href: '/hr/advances', icon: HandCoins },
  { label: 'Loans', href: '/hr/loans', icon: ReceiptText },
  { label: 'Documents', href: '/hr/documents', icon: FileText },
  { label: 'Announcements', href: '/hr/announcements', icon: BellRing },
  { label: 'Sites', href: '/hr/sites', icon: MapPin },
  { label: 'Shifts', href: '/hr/shifts', icon: Settings2 },
];
export default function HrLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const currentPage =
    links.find((link) => pathname === link.href)?.label ??
    (pathname === '/hr/account' ? 'My account' : 'HR workspace');
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
      {menuOpen && (
        <button
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 -translate-x-full flex-col border-r border-emerald-100 bg-white p-4 shadow-xl transition-transform lg:w-64 lg:translate-x-0 lg:p-5 lg:shadow-none ${menuOpen ? 'translate-x-0' : ''}`}
      >
        <Link
          href="/hr"
          className="flex w-auto items-center justify-start gap-2 rounded-xl font-bold text-emerald-700"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-emerald-100">HR</span>
          <span>WorkPilot</span>
        </Link>
        <button
          onClick={() => setMenuOpen(false)}
          className="absolute right-4 top-5 rounded-lg p-2 text-slate-500 lg:hidden"
        >
          <X className="size-5" />
        </button>
        <nav className="mt-8 flex-1 space-y-1 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {links.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              title={label}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 rounded-xl p-3 text-sm font-medium ${pathname === href ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Icon className="size-4 shrink-0" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-3 border-t border-slate-200 pt-3">
          <Link
            href="/hr/account"
            onClick={() => setMenuOpen(false)}
            className={`flex items-center gap-3 rounded-xl p-3 text-sm font-medium ${pathname === '/hr/account' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <UsersRound className="size-4" />
            My account
          </Link>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-xl p-3 text-sm font-medium text-rose-600 hover:bg-rose-50"
          >
            <LogOut className="size-4" />
            <span>Log out</span>
          </button>
        </div>
      </aside>
      <main className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <button
            onClick={() => setMenuOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <Menu className="size-5" />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              HR workspace
            </p>
            <h1 className="text-sm font-bold text-slate-800">{currentPage}</h1>
          </div>
        </header>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
