export function InsightsSection() {
  return (
    <section id="resources" className="scroll-mt-20 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-18 sm:px-6 md:py-24 lg:grid-cols-2 lg:items-center lg:px-8">
        <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-6 text-slate-800 sm:p-8">
          <p className="text-sm font-semibold text-indigo-600">WEEKLY OVERVIEW</p>
          <h2 className="mt-3 text-2xl font-bold">Know what needs your attention.</h2>
          <div className="mt-8 space-y-3">
            {[
              ['Leave requests', '08', 'bg-amber-400'],
              ['Tasks due this week', '24', 'bg-indigo-400'],
              ['Team attendance', '96%', 'bg-emerald-400'],
            ].map(([label, value, color]) => (
              <div
                className="flex items-center justify-between rounded-xl border border-white bg-white/75 p-4 shadow-sm"
                key={label}
              >
                <span className="flex items-center gap-3 text-sm text-slate-600">
                  <i className={`size-2.5 rounded-full ${color}`} />
                  {label}
                </span>
                <b>{value}</b>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-indigo-600">MAKE BETTER DECISIONS</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            The right context, when it matters.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Surface the updates that matter most to your team, so leaders can act early and
            employees always know what&apos;s next.
          </p>
          <ul className="mt-7 space-y-3 text-slate-700">
            {['Role-based workspaces', 'Simple activity tracking', 'Reliable team visibility'].map(
              (item) => (
                <li className="flex gap-3" key={item}>
                  <span className="font-bold text-indigo-600">✓</span>
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
