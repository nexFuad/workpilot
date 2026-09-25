'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { CalendarDays, Clock3, UserRound, X } from 'lucide-react';
import type { EmployeeProject } from '@/types/project.types';

const statusLabel: Record<string, string> = {
  planned: 'Planned',
  active: 'Active',
  on_hold: 'On hold',
  completed: 'Completed',
};

const statusStyle: Record<string, string> = {
  planned: 'bg-sky-50 text-sky-700',
  active: 'bg-emerald-50 text-emerald-700',
  on_hold: 'bg-amber-50 text-amber-700',
  completed: 'bg-violet-50 text-violet-700',
};

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(value))
    : 'Not set';

function initials(name: string | null, employeeId: string) {
  return (name || employeeId)
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function ProjectDialog({
  selected,
  onClose,
}: {
  selected: EmployeeProject | null;
  onClose: () => void;
}) {
  return (
    <Dialog.Root open={Boolean(selected)} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-white/70 bg-white p-6 shadow-2xl outline-none sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-sky-700">
                  {selected?.role}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyle[selected?.status ?? 'planned']}`}
                >
                  {statusLabel[selected?.status ?? 'planned']}
                </span>
              </div>
              <Dialog.Title className="mt-3 text-2xl font-bold text-slate-900">
                {selected?.name}
              </Dialog.Title>
              <Dialog.Description className="mt-1.5 text-sm text-slate-500">
                Complete project information and assigned team.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close project details"
                className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Your role', value: selected?.role, icon: UserRound },
              {
                label: 'Assigned on',
                value: formatDate(selected?.joinedAt ?? null),
                icon: Clock3,
              },
              {
                label: 'Start date',
                value: formatDate(selected?.startDate ?? null),
                icon: CalendarDays,
              },
              {
                label: 'Deadline',
                value: formatDate(selected?.endDate ?? null),
                icon: CalendarDays,
              },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <Icon className="size-4 text-sky-600" />
                <p className="mt-3 text-xs font-medium text-slate-500">{label}</p>
                <p className="mt-1 text-sm font-bold text-slate-800">{value || 'Not set'}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-100 p-5">
            <h3 className="text-sm font-bold text-slate-800">Project description</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {selected?.description || 'No project description provided.'}
            </p>
          </div>

          <div className="mt-6 rounded-2xl bg-sky-50 p-5">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="font-bold text-slate-700">Overall progress</span>
              <span className="font-bold text-sky-700">{selected?.progress ?? 0}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-sky-600"
                style={{ width: `${selected?.progress ?? 0}%` }}
              />
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900">Project team</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Everyone currently assigned to this project.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                {selected?.teamMembers.length ?? 0} member(s)
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {selected?.teamMembers.map((member) => (
                <article
                  key={member.id}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3.5"
                >
                  {member.user.profileImage ? (
                    <span
                      aria-label={member.user.fullName || member.user.employeeId}
                      style={{ backgroundImage: `url(${member.user.profileImage})` }}
                      className="size-11 shrink-0 rounded-xl bg-slate-100 bg-cover bg-center"
                    />
                  ) : (
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-xs font-bold text-emerald-700">
                      {initials(member.user.fullName, member.user.employeeId)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {member.user.fullName || member.user.employeeId}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {member.user.employeeId}
                    </p>
                  </div>
                  <span className="max-w-28 shrink-0 truncate rounded-lg bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700">
                    {member.role}
                  </span>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-5 text-xs text-slate-400">
            <span>Created {formatDate(selected?.createdAt ?? null)}</span>
            <span>Last updated {formatDate(selected?.updatedAt ?? null)}</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
