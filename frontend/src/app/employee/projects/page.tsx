'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { CalendarDays, Clock3, FolderKanban, Search, UserRound, UsersRound, X } from 'lucide-react';
import { useState } from 'react';
import { EmployeeHeader } from '@/components/employee/EmployeeHeader';
import { useSearchBar } from '@/hooks/use-search-bar';
import { projectsServer } from '@/server/projects.server';
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

function ProjectCardSkeleton() {
  return (
    <article className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex justify-between gap-4">
        <span className="h-4 w-24 rounded bg-slate-100" />
        <span className="h-5 w-16 rounded-full bg-slate-100" />
      </div>
      <span className="mt-3 block h-5 w-1/2 rounded bg-slate-100" />
      <span className="mt-2 block h-3 w-4/5 rounded bg-slate-100" />
      <span className="mt-4 block h-2 w-full rounded-full bg-slate-100" />
      <span className="mt-3 block h-3 w-2/3 rounded bg-slate-100" />
    </article>
  );
}

export default function ProjectsPage() {
  const [selected, setSelected] = useState<EmployeeProject | null>(null);
  const projects = useSearchBar({
    queryKey: ['projects', { limit: 50 }],
    queryFn: (search) => projectsServer.list({ limit: 50, search }),
  });
  const items = projects.data?.projects ?? [];
  const summary = projects.data?.summary;

  return (
    <section className="w-full space-y-6 pb-8">
      <EmployeeHeader
        title="My projects"
        description="See the projects you contribute to, your role, and their current progress."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-sky-100 bg-linear-to-br from-sky-600 to-cyan-500 p-5 text-white shadow-sm">
          <div className="flex justify-between">
            <p className="text-sm font-medium text-sky-100">Active projects</p>
            <FolderKanban className="size-5" />
          </div>
          {projects.isLoading ? (
            <span className="mt-5 block h-7 w-16 animate-pulse rounded bg-white/25" />
          ) : (
            <p className="mt-5 text-2xl font-bold">{summary?.active ?? 0}</p>
          )}
          <p className="mt-1 text-xs text-sky-100">Projects you are contributing to</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex justify-between">
            <p className="text-sm font-medium text-slate-500">Average progress</p>
            <CalendarDays className="size-5 text-sky-600" />
          </div>
          {projects.isLoading ? (
            <span className="mt-5 block h-7 w-20 animate-pulse rounded bg-slate-100" />
          ) : (
            <p className="mt-5 text-2xl font-bold text-slate-800">
              {summary?.averageProgress ?? 0}%
            </p>
          )}
          <p className="mt-1 text-xs text-slate-500">Across your assigned projects</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex justify-between">
            <p className="text-sm font-medium text-slate-500">Your roles</p>
            <UsersRound className="size-5 text-emerald-600" />
          </div>
          {projects.isLoading ? (
            <span className="mt-5 block h-7 w-16 animate-pulse rounded bg-slate-100" />
          ) : (
            <p className="mt-5 text-2xl font-bold text-slate-800">{summary?.roles ?? 0}</p>
          )}
          {projects.isLoading ? (
            <span className="mt-2 block h-3 w-32 animate-pulse rounded bg-slate-100" />
          ) : (
            <p className="mt-1 text-xs text-slate-500">Across {summary?.total ?? 0} assignments</p>
          )}
        </article>
      </div>

      <div>
        <h2 className="font-bold text-slate-800">Assigned projects</h2>
        <p className="mt-1 text-sm text-slate-500">
          Project details are managed by your HR or project manager.
        </p>
      </div>

      <div>
        <label className="relative block w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-sky-600" />
          <input
            type="search"
            value={projects.searchTerm}
            onChange={(event) => projects.setSearchTerm(event.target.value)}
            placeholder="Search project, status, role or team member..."
            className="h-11 w-full rounded-xl border border-sky-100 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
          />
        </label>
        {projects.isFetching && !projects.isLoading ? (
          <p className="mt-2 text-xs font-medium text-slate-500">Searching projects…</p>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {projects.isLoading ? (
          Array.from({ length: 4 }, (_, index) => <ProjectCardSkeleton key={index} />)
        ) : projects.isError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-10 text-center lg:col-span-2">
            <p className="text-sm font-semibold text-rose-700">Projects could not be loaded.</p>
            <button
              type="button"
              onClick={() => projects.refetch()}
              className="mt-3 text-sm font-bold text-rose-700 underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 lg:col-span-2">
            {projects.debouncedSearch
              ? 'No assigned project matched your search.'
              : 'You are not assigned to any projects yet.'}
          </div>
        ) : (
          items.map((project) => (
            <button
              type="button"
              key={project.id}
              onClick={() => setSelected(project)}
              className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-sky-600">
                    {project.role}
                  </p>
                  <h3 className="mt-1.5 truncate font-bold text-slate-800">{project.name}</h3>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyle[project.status] ?? statusStyle.planned}`}
                >
                  {statusLabel[project.status] ?? project.status}
                </span>
              </div>
              <p className="mt-2 line-clamp-1 text-sm text-slate-500">
                {project.description || 'No project description provided.'}
              </p>
              <div className="mt-3">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-500">Progress</span>
                  <span className="font-bold text-sky-700">{project.progress}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-sky-600"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span>{project.teamMembers.length} team member(s)</span>
                <span>Due {formatDate(project.endDate)}</span>
              </div>
            </button>
          ))
        )}
      </div>

      <Dialog.Root open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
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
    </section>
  );
}
