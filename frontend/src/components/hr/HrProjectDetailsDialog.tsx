'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { CalendarDays, FolderKanban, PencilLine, X } from 'lucide-react';
import type { HrProject, ProjectStatus } from '@/types/hr-project.types';

export const statusLabel: Record<ProjectStatus, string> = {
  planned: 'Planned',
  active: 'Active',
  on_hold: 'On hold',
  completed: 'Completed',
};

export const statusStyle: Record<ProjectStatus, string> = {
  planned: 'bg-sky-100 text-sky-700',
  active: 'bg-emerald-100 text-emerald-700',
  on_hold: 'bg-amber-100 text-amber-700',
  completed: 'bg-violet-100 text-violet-700',
};

export function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(value))
    : 'Not set';
}

export function HrProjectDetailsDialog({
  viewTarget,
  onClose,
  onEdit,
}: {
  viewTarget: HrProject | null;
  onClose: () => void;
  onEdit: (project: HrProject) => void;
}) {
  return (
    <Dialog.Root open={Boolean(viewTarget)} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
          {viewTarget && (
            <>
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex min-w-0 items-start gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <FolderKanban className="size-6" />
                  </span>
                  <div className="min-w-0">
                    <Dialog.Title className="text-2xl font-bold text-slate-800">
                      {viewTarget.name}
                    </Dialog.Title>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle[viewTarget.status]}`}
                      >
                        {statusLabel[viewTarget.status]}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {viewTarget.assignments.length} team member
                        {viewTarget.assignments.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                </div>
                <Dialog.Close className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200">
                  <X className="size-4" />
                </Dialog.Close>
              </div>

              <div className="mt-6">
                <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
                  Project description
                </h3>
                <Dialog.Description className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {viewTarget.description || 'No project description was provided.'}
                </Dialog.Description>
              </div>

              <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                  <dt className="text-xs text-slate-400">Project start</dt>
                  <dd className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-700">
                    <CalendarDays className="size-4 text-emerald-600" />
                    {formatDate(viewTarget.startDate)}
                  </dd>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                  <dt className="text-xs text-slate-400">Deadline</dt>
                  <dd className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-700">
                    <CalendarDays className="size-4 text-amber-600" />
                    {formatDate(viewTarget.endDate)}
                  </dd>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                  <dt className="text-xs text-slate-400">Created</dt>
                  <dd className="mt-1 text-sm font-bold text-slate-700">
                    {formatDate(viewTarget.createdAt)}
                  </dd>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                  <dt className="text-xs text-slate-400">Last updated</dt>
                  <dd className="mt-1 text-sm font-bold text-slate-700">
                    {formatDate(viewTarget.updatedAt)}
                  </dd>
                </div>
              </dl>

              <section className="mt-6 rounded-2xl border border-slate-200 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-800">Project progress</h3>
                    <p className="mt-1 text-xs text-slate-500">Current completion percentage</p>
                  </div>
                  <span className="text-xl font-bold text-emerald-700">{viewTarget.progress}%</span>
                </div>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${viewTarget.progress}%` }}
                  />
                </div>
              </section>

              <section className="mt-6">
                <div>
                  <h3 className="font-bold text-slate-800">Assigned project team</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Employees and their responsibilities in this project.
                  </p>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {viewTarget.assignments.map((assignment) => (
                    <article
                      key={assignment.id}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-sm font-bold text-emerald-700 shadow-sm">
                        {(assignment.user.fullName || assignment.user.employeeId)
                          .split(' ')
                          .map((part) => part[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-800">
                          {assignment.user.fullName || assignment.user.employeeId}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {assignment.user.employeeId} · {assignment.role}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
                <Dialog.Close className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 hover:bg-slate-50">
                  Close
                </Dialog.Close>
                <button
                  type="button"
                  onClick={() => {
                    onEdit(viewTarget);
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  <PencilLine className="size-4" /> Edit project
                </button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
