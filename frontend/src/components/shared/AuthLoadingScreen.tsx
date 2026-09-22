import { BriefcaseBusiness } from 'lucide-react';

type AuthLoadingScreenProps = {
  message?: string;
};

export function AuthLoadingScreen({
  message = 'Restoring your secure session…',
}: AuthLoadingScreenProps) {
  return (
    <main
      className="grid min-h-screen place-items-center bg-white p-6"
      aria-busy="true"
      aria-live="polite"
    >
      <section className="text-center">
        <div className="relative mx-auto size-16">
          <span className="absolute inset-0 animate-ping rounded-2xl bg-emerald-100 opacity-60 [animation-duration:1.8s]" />
          <span className="relative grid size-16 place-items-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-200">
            <BriefcaseBusiness className="size-7" strokeWidth={2.25} />
          </span>
        </div>
        <h1 className="mt-5 text-xl font-bold tracking-tight text-slate-900">WorkPilot</h1>
        <p className="mt-2 text-sm text-slate-500">{message}</p>
        <div className="mt-5 flex items-center justify-center gap-1.5" aria-hidden="true">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="size-2 animate-bounce rounded-full bg-emerald-500"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
