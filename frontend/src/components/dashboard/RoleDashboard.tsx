'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';

export function RoleDashboard({
  title,
  description,
  tone,
}: {
  title: string;
  description: string;
  tone: string;
}) {
  const router = useRouter();
  const { user, logout } = useAuth();
  function handleLogout() {
    logout.mutate(undefined, {
      onSuccess: () => {
        toast.success('You have been logged out.');
        router.replace('/');
      },
      onError: () => router.replace('/'),
    });
  }
  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <section className="mx-auto max-w-5xl">
        <header className={`rounded-3xl border p-7 ${tone}`}>
          <p className="text-sm font-semibold">SIGNED IN AS {user?.role?.toUpperCase()}</p>
          <h1 className="mt-2 text-3xl font-bold">{title}</h1>
          <p className="mt-2 text-slate-600">{description}</p>
          <button
            onClick={handleLogout}
            disabled={logout.isPending}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm"
          >
            <LogOut className="size-4" />
            {logout.isPending ? 'Logging out…' : 'Log out'}
          </button>
        </header>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-slate-500">
          Your role-based dashboard content will be added here.
        </div>
      </section>
    </main>
  );
}
