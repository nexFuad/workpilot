import type { ReactNode } from 'react';

type EmployeeHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmployeeHeader({
  eyebrow = 'Employee area',
  title,
  description,
  action,
}: EmployeeHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-600">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">{description}</p>
      </div>
      {action}
    </header>
  );
}
