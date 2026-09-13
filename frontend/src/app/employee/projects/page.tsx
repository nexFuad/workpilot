'use client';
import { CalendarDays, FolderKanban, UsersRound } from 'lucide-react';
import { EmployeeHeader } from '@/components/employee/EmployeeHeader';
import { useProjects } from '@/hooks/use-projects';

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
        new Date(value),
      )
    : 'Not set';
export default function ProjectsPage() {
  const projects = useProjects();
  const items = projects.data?.projects ?? [];
  const active = items.filter((project) => project.status === 'active');
  return (
    <section className="w-full space-y-6 pb-8">
      <EmployeeHeader
        title="My projects"
        description="See the projects you contribute to, your role, and their current progress."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-600 to-cyan-500 p-5 text-white shadow-sm">
          <div className="flex justify-between">
            <p className="text-sm font-medium text-sky-100">Active projects</p>
            <FolderKanban className="size-5" />
          </div>
          <p className="mt-5 text-2xl font-bold">{active.length}</p>
          <p className="mt-1 text-xs text-sky-100">Projects you are contributing to</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex justify-between">
            <p className="text-sm font-medium text-slate-500">Average progress</p>
            <CalendarDays className="size-5 text-sky-600" />
          </div>
          <p className="mt-5 text-2xl font-bold text-slate-800">
            {items.length
              ? Math.round(
                  items.reduce((total, project) => total + project.progress, 0) / items.length,
                )
              : 0}
            %
          </p>
          <p className="mt-1 text-xs text-slate-500">Across your assigned projects</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex justify-between">
            <p className="text-sm font-medium text-slate-500">Your roles</p>
            <UsersRound className="size-5 text-emerald-600" />
          </div>
          <p className="mt-5 text-2xl font-bold text-slate-800">
            {new Set(items.map((project) => project.role)).size}
          </p>
          <p className="mt-1 text-xs text-slate-500">Across {items.length} assignments</p>
        </article>
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="font-bold text-slate-800">Assigned projects</h2>
          <p className="mt-1 text-sm text-slate-500">
            Project details are managed by your HR or project manager.
          </p>
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-2">
          {projects.isLoading ? (
            <p className="text-sm text-slate-500">Loading projects…</p>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500 lg:col-span-2">
              You are not assigned to any projects yet.
            </p>
          ) : (
            items.map((project) => (
              <article key={project.id} className="rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-sky-600">
                      {project.role}
                    </p>
                    <h3 className="mt-2 font-bold text-slate-800">{project.name}</h3>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                    {project.status}
                  </span>
                </div>
                <p className="mt-3 min-h-12 text-sm leading-6 text-slate-500">
                  {project.description || 'No project description provided.'}
                </p>
                <div className="mt-5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-600">Project progress</span>
                    <span className="font-bold text-sky-700">{project.progress}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-sky-600"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
                <div className="mt-5 flex justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                  <span>Started: {formatDate(project.startDate)}</span>
                  <span>Target: {formatDate(project.endDate)}</span>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </section>
  );
}
