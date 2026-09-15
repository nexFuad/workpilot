'use client';

import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  FolderKanban,
  LoaderCircle,
  MoreHorizontal,
  PencilLine,
  Plus,
  Search,
  Trash2,
  UserPlus,
  UsersRound,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Pagination } from '@/components/shared/Pagination';
import { SoftSelect } from '@/components/ui/SoftSelect';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { hrProjectsServer } from '@/server/hr-projects.server';
import type { HrProject, HrProjectInput, ProjectStatus } from '@/types/hr-project.types';

const emptyForm: HrProjectInput = {
  name: '',
  description: '',
  status: 'planned',
  progress: 0,
  startDate: '',
  endDate: '',
  assignments: [],
};

const statusLabel: Record<ProjectStatus, string> = {
  planned: 'Planned',
  active: 'Active',
  on_hold: 'On hold',
  completed: 'Completed',
};

const statusStyle: Record<ProjectStatus, string> = {
  planned: 'bg-sky-100 text-sky-700',
  active: 'bg-emerald-100 text-emerald-700',
  on_hold: 'bg-amber-100 text-amber-700',
  completed: 'bg-violet-100 text-violet-700',
};

const fieldClass =
  'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100';

function toInput(project: HrProject): HrProjectInput {
  return {
    name: project.name,
    description: project.description ?? '',
    status: project.status,
    progress: project.progress,
    startDate: project.startDate?.slice(0, 10) ?? '',
    endDate: project.endDate?.slice(0, 10) ?? '',
    assignments: project.assignments.map((assignment) => ({
      userId: assignment.userId,
      role: assignment.role,
    })),
  };
}

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(value))
    : 'Not set';
}

function truncateWords(value: string | null, limit = 10) {
  if (!value?.trim()) return 'No description';
  const words = value.trim().split(/\s+/);
  return words.length > limit ? `${words.slice(0, limit).join(' ')}...` : value;
}

export default function HrProjectsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | ProjectStatus>('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<HrProject | null>(null);
  const [viewTarget, setViewTarget] = useState<HrProject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HrProject | null>(null);
  const [form, setForm] = useState<HrProjectInput>(emptyForm);
  const debouncedSearch = useDebouncedValue(search.trim());
  const params = { search: debouncedSearch, status, page, limit: 10 };
  const projectsQuery = useQuery({
    queryKey: ['hr', 'projects', params],
    queryFn: () => hrProjectsServer.list(params),
  });
  const refreshProjects = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['hr', 'projects'] }),
      queryClient.invalidateQueries({ queryKey: ['projects'] }),
    ]);
  };
  const create = useMutation({ mutationFn: hrProjectsServer.create, onSuccess: refreshProjects });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: HrProjectInput }) =>
      hrProjectsServer.update(id, input),
    onSuccess: refreshProjects,
  });
  const removeProject = useMutation({
    mutationFn: hrProjectsServer.remove,
    onSuccess: refreshProjects,
  });
  const api = { projects: projectsQuery, create, update, remove: removeProject };

  const projects = api.projects.data?.projects ?? [];
  const employees = api.projects.data?.employees ?? [];
  const summary = api.projects.data?.summary;
  const pagination = api.projects.data?.pagination;
  const currentPage = pagination?.page ?? page;

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      assignments: employees[0] ? [{ userId: employees[0].id, role: 'Contributor' }] : [],
    });
    setEditorOpen(true);
  };

  const openEdit = (project: HrProject) => {
    setEditing(project);
    setForm(toInput(project));
    setEditorOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.assignments.length || form.assignments.some((item) => !item.userId || !item.role)) {
      return toast.error('Add at least one employee with a project role.');
    }
    if (new Set(form.assignments.map((item) => item.userId)).size !== form.assignments.length) {
      return toast.error('The same employee cannot be assigned twice.');
    }
    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      return toast.error('End date must be after the start date.');
    }

    try {
      if (editing) {
        await api.update.mutateAsync({ id: editing.id, input: form });
        toast.success('Project and team updated.');
      } else {
        await api.create.mutateAsync(form);
        toast.success('Project assigned to the selected employees.');
      }
      setEditorOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Project could not be saved.');
    }
  };

  const changeStatus = async (project: HrProject, nextStatus: ProjectStatus) => {
    try {
      await api.update.mutateAsync({
        id: project.id,
        input: {
          ...toInput(project),
          status: nextStatus,
          progress: nextStatus === 'completed' ? 100 : project.progress,
        },
      });
      toast.success(`Project status changed to ${statusLabel[nextStatus].toLowerCase()}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Status could not be updated.');
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await api.remove.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      toast.success('Project deleted.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Project could not be deleted.');
    }
  };

  const updateAssignment = (index: number, patch: { userId?: string; role?: string }) => {
    setForm((current) => ({
      ...current,
      assignments: current.assignments.map((assignment, assignmentIndex) =>
        assignmentIndex === index ? { ...assignment, ...patch } : assignment,
      ),
    }));
  };

  const addAssignment = () => {
    const selectedIds = new Set(form.assignments.map((assignment) => assignment.userId));
    const employee = employees.find((item) => !selectedIds.has(item.id));
    if (!employee) return toast.message('Every active employee is already on this project.');
    setForm((current) => ({
      ...current,
      assignments: [...current.assignments, { userId: employee.id, role: 'Contributor' }],
    }));
  };

  const removeAssignment = (index: number) => {
    if (form.assignments.length === 1) return toast.error('A project needs at least one member.');
    setForm((current) => ({
      ...current,
      assignments: current.assignments.filter((_, assignmentIndex) => assignmentIndex !== index),
    }));
  };

  const saving = api.create.isPending || api.update.isPending;
  return (
    <section className="w-full space-y-6 pb-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
            HR workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-800">Assign projects</h1>
          <p className="mt-2 text-sm text-slate-600">
            Build project teams and manage timelines, roles and progress.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          disabled={!employees.length && !api.projects.isLoading}
          className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          <Plus className="size-4" />
          Assign project
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total projects', value: summary?.total ?? 0, icon: FolderKanban },
          {
            label: 'Active projects',
            value: summary?.active ?? 0,
            icon: Clock3,
          },
          {
            label: 'Completed',
            value: summary?.completed ?? 0,
            icon: CheckCircle2,
          },
          { label: 'Team assignments', value: summary?.assignments ?? 0, icon: UsersRound },
        ].map(({ label, value, icon: Icon }) => (
          <article
            key={label}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <Icon className="size-5" />
            </span>
            <div>
              {api.projects.isLoading ? (
                <span className="block h-7 w-16 animate-pulse rounded bg-slate-100" />
              ) : (
                <p className="text-2xl font-bold text-slate-800">{value}</p>
              )}
              <p className="text-xs font-medium text-slate-500">{label}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search project or employee..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-emerald-400 focus:bg-white"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {(['all', 'planned', 'active', 'on_hold', 'completed'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setStatus(item);
                setPage(1);
              }}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition ${status === item ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {item === 'all' ? 'All projects' : statusLabel[item]}
            </button>
          ))}
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-[70vh] overflow-auto">
          <table className="w-full min-w-126.5 text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Project</th>
                <th className="px-5 py-3">Project start</th>
                <th className="px-5 py-3">Deadline</th>
                <th className="px-5 py-3">Progress</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {api.projects.isLoading ? (
                Array.from({ length: 10 }, (_, row) => (
                  <tr key={row} className="animate-pulse">
                    {Array.from({ length: 6 }, (_, cell) => (
                      <td key={cell} className="px-5 py-5">
                        <span className="block h-4 w-24 rounded bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : api.projects.isError ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-sm text-rose-600">
                    Projects could not be loaded.
                  </td>
                </tr>
              ) : projects.length ? (
                projects.map((project) => (
                  <tr key={project.id} className="transition hover:bg-slate-50/70">
                    <td className="max-w-sm px-5 py-4">
                      <div className="flex items-start gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                          <FolderKanban className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800">{project.name}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {truncateWords(project.description)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                        <CalendarDays className="size-4 text-emerald-600" />
                        {formatDate(project.startDate)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                        <CalendarDays className="size-4 text-amber-600" />
                        {formatDate(project.endDate)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex w-32 items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700">
                          {project.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <SoftSelect
                        value={project.status}
                        disabled={api.update.isPending}
                        onValueChange={(value) =>
                          void changeStatus(project, value as ProjectStatus)
                        }
                        placeholder="Select status"
                        tone="emerald"
                        compact
                        triggerClassName={`border-transparent ${statusStyle[project.status]}`}
                        options={(
                          ['planned', 'active', 'on_hold', 'completed'] as ProjectStatus[]
                        ).map((item) => ({ value: item, label: statusLabel[item] }))}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <DropdownMenu.Root>
                        <div className="flex justify-end">
                          <DropdownMenu.Trigger asChild>
                            <button
                              type="button"
                              aria-label={`Open actions for ${project.name}`}
                              className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 data-[state=open]:border-emerald-200 data-[state=open]:bg-emerald-50 data-[state=open]:text-emerald-700"
                            >
                              <MoreHorizontal className="size-5" />
                            </button>
                          </DropdownMenu.Trigger>
                        </div>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content
                            align="end"
                            sideOffset={6}
                            className="z-50 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-200/70"
                          >
                            <DropdownMenu.Item
                              onSelect={() => setViewTarget(project)}
                              className="flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 outline-none data-highlighted:bg-emerald-50 data-highlighted:text-emerald-700"
                            >
                              <Eye className="size-4" /> View project
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              onSelect={() => openEdit(project)}
                              className="flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 outline-none data-highlighted:bg-emerald-50 data-highlighted:text-emerald-700"
                            >
                              <PencilLine className="size-4" /> Edit project
                            </DropdownMenu.Item>
                            <DropdownMenu.Separator className="my-1 h-px bg-slate-100" />
                            <DropdownMenu.Item
                              onSelect={() => setDeleteTarget(project)}
                              className="flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-rose-600 outline-none data-highlighted:bg-rose-50"
                            >
                              <Trash2 className="size-4" /> Delete project
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-sm text-slate-500">
                    No projects found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-5 py-4">
          <Pagination
            page={currentPage}
            totalItems={pagination?.total ?? 0}
            pageSize={10}
            onPageChange={setPage}
          />
        </div>
      </section>

      <Dialog.Root open={Boolean(viewTarget)} onOpenChange={(open) => !open && setViewTarget(null)}>
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
                    <span className="text-xl font-bold text-emerald-700">
                      {viewTarget.progress}%
                    </span>
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
                      openEdit(viewTarget);
                      setViewTarget(null);
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

      <Dialog.Root open={editorOpen} onOpenChange={setEditorOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[2px]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-2xl font-bold text-slate-800">
                  {editing ? 'Edit assigned project' : 'Assign a new project'}
                </Dialog.Title>
                <Dialog.Description className="mt-1.5 text-sm text-slate-500">
                  Set up the project and add one or more employees to its team.
                </Dialog.Description>
              </div>
              <Dialog.Close className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200">
                <X className="size-4" />
              </Dialog.Close>
            </div>

            <form onSubmit={save} className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-bold text-slate-700 sm:col-span-2">
                Project name
                <input
                  required
                  minLength={3}
                  maxLength={160}
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="e.g. Employee mobile application"
                  className={fieldClass}
                />
              </label>

              <label className="block text-sm font-bold text-slate-700 sm:col-span-2">
                Project description
                <textarea
                  rows={4}
                  maxLength={2000}
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  placeholder="Describe the goal, expected deliverables and project scope..."
                  className={`${fieldClass} resize-none leading-6`}
                />
              </label>

              <label className="block text-sm font-bold text-slate-700">
                Project status
                <SoftSelect
                  value={form.status}
                  onValueChange={(value) => setForm({ ...form, status: value as ProjectStatus })}
                  placeholder="Select project status"
                  tone="emerald"
                  options={[
                    { value: 'planned', label: 'Planned' },
                    { value: 'active', label: 'Active' },
                    { value: 'on_hold', label: 'On hold' },
                    { value: 'completed', label: 'Completed' },
                  ]}
                />
              </label>

              <label className="block text-sm font-bold text-slate-700">
                Progress percentage
                <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={form.progress}
                    onChange={(event) => setForm({ ...form, progress: Number(event.target.value) })}
                    className="flex-1 accent-emerald-600"
                  />
                  <span className="w-10 text-right text-sm font-bold text-emerald-700">
                    {form.progress}%
                  </span>
                </div>
              </label>

              <label className="block text-sm font-bold text-slate-700">
                Start date
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(event) => setForm({ ...form, startDate: event.target.value })}
                  className={fieldClass}
                />
              </label>

              <label className="block text-sm font-bold text-slate-700">
                End date
                <input
                  type="date"
                  min={form.startDate || undefined}
                  value={form.endDate}
                  onChange={(event) => setForm({ ...form, endDate: event.target.value })}
                  className={fieldClass}
                />
              </label>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-700">Project team</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Assign employees and define their responsibility.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addAssignment}
                    disabled={form.assignments.length >= employees.length}
                    className="inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-50 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                  >
                    <UserPlus className="size-4" /> Add member
                  </button>
                </div>

                <div className="mt-3 space-y-3">
                  {form.assignments.map((assignment, index) => {
                    const otherSelected = new Set(
                      form.assignments
                        .filter((_, assignmentIndex) => assignmentIndex !== index)
                        .map((item) => item.userId),
                    );
                    return (
                      <div
                        key={`${index}-${assignment.userId}`}
                        className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3 sm:grid-cols-[1.25fr_1fr_auto] sm:items-end"
                      >
                        <label className="block text-xs font-bold text-slate-600">
                          Employee
                          <SoftSelect
                            value={assignment.userId || undefined}
                            onValueChange={(value) => updateAssignment(index, { userId: value })}
                            placeholder="Select employee"
                            tone="emerald"
                            options={employees
                              .filter((employee) => !otherSelected.has(employee.id))
                              .map((employee) => ({
                                value: employee.id,
                                label: `${employee.fullName || employee.employeeId} · ${employee.employeeId}`,
                              }))}
                          />
                        </label>
                        <label className="block text-xs font-bold text-slate-600">
                          Project role
                          <input
                            required
                            minLength={2}
                            maxLength={80}
                            value={assignment.role}
                            onChange={(event) =>
                              updateAssignment(index, { role: event.target.value })
                            }
                            placeholder="e.g. Designer"
                            className={fieldClass}
                          />
                        </label>
                        <button
                          type="button"
                          aria-label="Remove team member"
                          onClick={() => removeAssignment(index)}
                          className="grid size-11 place-items-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:col-span-2 sm:flex-row sm:justify-end">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <FolderKanban className="size-4" />
                  )}
                  {editing ? 'Save changes' : 'Assign project'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[2px]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl">
            <span className="grid size-11 place-items-center rounded-xl bg-rose-50 text-rose-600">
              <Trash2 className="size-5" />
            </span>
            <Dialog.Title className="mt-4 text-xl font-bold text-slate-800">
              Delete assigned project?
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-6 text-slate-500">
              “{deleteTarget?.name}” and all of its employee assignments will be permanently
              removed.
            </Dialog.Description>
            <div className="mt-6 flex justify-end gap-3">
              <Dialog.Close className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 hover:bg-slate-50">
                Cancel
              </Dialog.Close>
              <button
                type="button"
                disabled={api.remove.isPending}
                onClick={() => void remove()}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {api.remove.isPending && <LoaderCircle className="size-4 animate-spin" />}
                Delete project
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
