import { Settings2, UserRound } from 'lucide-react';
import { ProfileSettings } from '@/components/shared/ProfileSettings';

export default function HrAccountPage() {
  return (
    <section className="w-full space-y-6 pb-8">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
            <UserRound className="size-5" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
              Account settings
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">My account</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your HR profile, contact information, photo and password.
            </p>
          </div>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
          <Settings2 className="size-4 text-emerald-600" /> HR profile
        </span>
      </div>

      <ProfileSettings title="HR profile settings" />
    </section>
  );
}
