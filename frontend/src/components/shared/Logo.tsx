import { BriefcaseBusiness } from 'lucide-react';
import Link from 'next/link';

type LogoProps = {
  className?: string;
};

export function Logo({ className = '' }: LogoProps) {
  return (
    <Link
      href="/#home"
      aria-label="WorkPilot home"
      className={`inline-flex items-center gap-2.5 font-bold text-slate-900 ${className}`}
    >
      <span className="grid size-9 place-items-center rounded-xl bg-indigo-100 text-indigo-700 shadow-sm shadow-indigo-100">
        <BriefcaseBusiness className="size-5" strokeWidth={2.5} />
      </span>
      <span className="text-xl tracking-tight">WorkPilot</span>
    </Link>
  );
}
