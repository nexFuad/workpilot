import { ArrowRight, CheckCircle2, Play } from 'lucide-react';

export function HeroSection() {
  return (
    <section
      id="home"
      className="scroll-mt-20 overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white"
    >
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-18 sm:px-6 md:py-24 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-8">
        <div>
          <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700">
            Office management, simplified
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-slate-800 sm:text-5xl lg:text-6xl">
            One place for your people, work, and progress.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            WorkPilot brings attendance, leave, projects, and team operations into one thoughtful
            workspace your organization will enjoy using.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-100 px-5 py-3.5 font-semibold text-indigo-700 shadow-lg shadow-indigo-100 transition hover:bg-indigo-200"
            >
              Get started <ArrowRight className="size-4" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Play className="size-4 fill-current" /> See how it works
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-600">
            {['No complicated setup', 'Built for every team', 'Secure by design'].map((item) => (
              <span className="flex items-center gap-1.5" key={item}>
                <CheckCircle2 className="size-4 text-emerald-600" />
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-indigo-100 bg-white p-4 shadow-2xl shadow-indigo-100/60 sm:p-6">
          <div className="rounded-2xl bg-slate-50 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Good morning, Samira</p>
                <h2 className="mt-1 text-xl font-bold">Your team at a glance</h2>
              </div>
              <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                Live
              </span>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                ['Present', '42'],
                ['On leave', '3'],
                ['Projects', '12'],
              ].map(([label, value]) => (
                <div className="rounded-xl bg-white p-3 shadow-sm" key={label}>
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-1 text-xl font-bold">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-xl bg-indigo-100 p-4 text-indigo-900">
              <p className="text-xs text-indigo-700">Today&apos;s team progress</p>
              <p className="mt-1 text-2xl font-bold">84% on track</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-indigo-200">
                <div className="h-full w-[84%] rounded-full bg-indigo-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
