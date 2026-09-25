import type { ReactNode } from 'react';

type HrHeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
  badge?: ReactNode;
};

export function HrHeader({ title, description, action, badge }: HrHeaderProps) {
  return (
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
          HR workspace
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold text-slate-800">{title}</h1>
          {badge}
        </div>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p>
      </div>
      {action}
    </header>
  );
}
