'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/shared/Logo';

export function ErrorView({ message }: { message: string }) {
  const router = useRouter();

  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-indigo-50 via-white to-sky-50 px-5 py-12 text-slate-900">
      <div className="w-full max-w-xl text-center">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{message}</h1>
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-indigo-100 bg-white/70 px-6 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <ArrowLeft className="size-4" />
          Go back
        </button>
      </div>
    </main>
  );
}
