const roles = [
  {
    role: 'HR teams',
    title: 'Put people first, without the paperwork.',
    text: 'Manage employee information, attendance, leave, and important HR workflows.',
    tone: 'bg-emerald-50 border-emerald-100 text-emerald-700',
  },
  {
    role: 'Employees',
    title: 'A workday that feels straightforward.',
    text: 'See tasks, time, requests, and updates in a focused personal workspace.',
    tone: 'bg-sky-50 border-sky-100 text-sky-700',
  },
];
export function RolesSection() {
  return (
    <section id="roles" className="scroll-mt-20 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-18 sm:px-6 md:py-24 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-indigo-600">BUILT FOR EVERY ROLE</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            One platform. A better view for everyone.
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {roles.map(({ role, title, text, tone }) => (
            <article className={`rounded-2xl border p-7 ${tone}`} key={role}>
              <p className="text-sm font-semibold">{role}</p>
              <h3 className="mt-5 text-xl font-bold text-slate-900">{title}</h3>
              <p className="mt-3 leading-7 text-slate-600">{text}</p>
              <span className="mt-8 inline-flex rounded-lg bg-white px-3 py-2 text-sm font-semibold shadow-sm">
                Role-based dashboard
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
