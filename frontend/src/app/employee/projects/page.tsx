'use client';

import { CalendarDays, FolderKanban, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { EmployeeHeader } from '@/components/employee/EmployeeHeader';
import { ProjectDialog } from '@/components/employee/ProjectDialog';
import { SearchInput } from '@/components/shared/SearchInput';
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
        <SearchInput
          wrapperClassName="relative block w-full sm:max-w-md"
          iconClassName="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-sky-600"
          value={projects.searchTerm}
          onChange={(event) => projects.setSearchTerm(event.target.value)}
          placeholder="Search project, status, role or team member..."
          className="h-11 w-full rounded-xl border border-sky-100 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
        />
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

      <ProjectDialog selected={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
