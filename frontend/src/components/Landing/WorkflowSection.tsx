const steps = [
  ['01', 'Set up your workspace', 'Add your company, departments, and team members in minutes.'],
  ['02', 'Bring work together', 'Organize daily operations, attendance, tasks, and requests.'],
  ['03', 'Stay in the loop', 'Give everyone the right view and make decisions with confidence.'],
];
export function WorkflowSection() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-18 sm:px-6 md:py-24 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold text-indigo-600">HOW IT WORKS</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            A clearer workday starts here.
          </h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map(([number, title, text]) => (
            <article
              className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200"
              key={number}
            >
              <span className="text-sm font-bold text-indigo-600">{number}</span>
              <h3 className="mt-6 text-xl font-bold">{title}</h3>
              <p className="mt-3 leading-7 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
