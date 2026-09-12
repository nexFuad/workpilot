const questions = [
  [
    'Can WorkPilot support different user roles?',
    'Yes. Administrators, HR teams, and employees each receive a focused workspace designed for their responsibilities.',
  ],
  [
    'Will it work for a growing team?',
    'Yes. The platform is structured to grow from a small office to multiple departments and teams.',
  ],
  [
    'Can I manage leave and attendance together?',
    'Yes. Attendance, leave requests, and employee information are designed to live in the same workplace flow.',
  ],
];
export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 bg-white">
      <div className="mx-auto max-w-3xl px-4 py-18 sm:px-6 md:py-24 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold text-indigo-600">FAQ</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Questions, answered simply.
          </h2>
        </div>
        <div className="mt-10 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-6">
          {questions.map(([question, answer]) => (
            <details className="group py-5" key={question}>
              <summary className="cursor-pointer list-none pr-8 font-semibold text-slate-900 marker:hidden">
                {question}
                <span className="float-right text-lg text-indigo-600 group-open:rotate-45">+</span>
              </summary>
              <p className="pt-3 leading-7 text-slate-600">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
