'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

type AuthSessionErrorScreenProps = {
  isRetrying?: boolean;
  onRetry: () => void;
};

export function AuthSessionErrorScreen({
  isRetrying = false,
  onRetry,
}: AuthSessionErrorScreenProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <section
        className="w-full max-w-sm rounded-3xl border border-amber-100 bg-white p-8 text-center shadow-xl shadow-slate-200/60"
        role="alert"
      >
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-50 text-amber-600">
          <AlertTriangle className="size-7" />
        </div>
        <h1 className="mt-5 text-xl font-bold text-slate-900">Session check unavailable</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          We could not reach WorkPilot securely. Your account has not been signed out.
        </p>
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`size-4 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Checking again…' : 'Try again'}
        </button>
      </section>
    </main>
  );
}
