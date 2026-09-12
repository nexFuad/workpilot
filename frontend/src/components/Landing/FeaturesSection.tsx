import { BarChart3, CalendarDays, FolderKanban, UsersRound } from 'lucide-react';

const features = [
  {
    icon: UsersRound,
    title: 'Employee directory',
    text: 'Keep profiles, departments, and team information organized.',
  },
  {
    icon: CalendarDays,
    title: 'Attendance & leave',
    text: 'Make daily attendance and leave requests easy to manage.',
  },
  {
    icon: FolderKanban,
    title: 'Projects & tasks',
    text: 'Give every team visibility into work, owners, and deadlines.',
  },
  {
    icon: BarChart3,
    title: 'Clear reports',
    text: 'Turn operational activity into useful, timely decisions.',
  },
];
export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-18 sm:px-6 md:py-24 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-indigo-600">EVERYTHING IN ONE PLACE</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            The essentials your office needs to move smoothly.
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            A single source of truth for people operations—without adding more noise to your day.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, text }) => (
            <article
              className="rounded-2xl border border-slate-200 p-6 transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50"
              key={title}
            >
              <span className="grid size-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-5 font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
