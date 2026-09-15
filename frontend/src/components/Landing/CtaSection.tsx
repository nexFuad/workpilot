import { ArrowRight } from 'lucide-react';
export function CtaSection() {
  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-18 sm:px-6 md:py-24 lg:px-8">
        <div className="rounded-3xl border border-indigo-100 bg-linear-to-br from-indigo-100 via-violet-50 to-sky-100 px-6 py-12 text-center text-slate-800 sm:px-12">
          <p className="text-sm font-semibold text-indigo-600">READY WHEN YOU ARE</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Build a more organized, more human workday.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-600">
            Bring your office operations into a place where everyone can do their best work.
          </p>
          <a
            href="/login"
            className="mt-8 inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white/80 px-5 py-3.5 font-semibold text-indigo-700 shadow-sm transition hover:bg-white"
          >
            Start with WorkPilot <ArrowRight className="size-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
