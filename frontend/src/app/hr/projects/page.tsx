'use client';

import { DeleteModal } from '@/components/shared/DeleteModal';
import { HrHeader } from '@/components/hr/HrHeader';
import {
  HrProjectDetailsDialog,
  formatDate,
  statusLabel,
  statusStyle,
} from '@/components/hr/HrProjectDetailsDialog';
import { HrProjectEditorDialog } from '@/components/hr/HrProjectEditorDialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  FolderKanban,
  MoreHorizontal,
  PencilLine,
  Plus,
  Trash2,
  UsersRound,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Pagination } from '@/components/shared/Pagination';
import { SoftSelect } from '@/components/ui/SoftSelect';
import { SearchInput } from '@/components/shared/SearchInput';
import { useSearchBar } from '@/hooks/use-search-bar';
import { hrProjectsServer } from '@/server/hr-projects.server';
import type {
  HrProject,
  HrProjectInput,
  HrProjectUpdate,
  ProjectAssignmentPatch,
  ProjectStatus,
} from '@/types/hr-project.types';

const emptyForm: HrProjectInput = {
  name: '',
  description: '',
  status: 'planned',
  progress: 0,
  startDate: '',
  endDate: '',
  assignments: [],
};

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

function truncateWords(value: string | null, limit = 10) {
  if (!value?.trim()) return 'No description';
  const words = value.trim().split(/\s+/);
  return words.length > limit ? `${words.slice(0, limit).join(' ')}...` : value;
}

export default function HrProjectsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'all' | ProjectStatus>('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<HrProject | null>(null);
  const [viewTarget, setViewTarget] = useState<HrProject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HrProject | null>(null);
  const [form, setForm] = useState<HrProjectInput>(emptyForm);
  const projectsQuery = useSearchBar({
    queryKey: ['hr', 'projects', { status, page, limit: 10 }],
    queryFn: (search) => hrProjectsServer.list({ search, status, page, limit: 10 }),
  });
  const refreshProjects = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['hr', 'projects'] }),
      queryClient.invalidateQueries({ queryKey: ['projects'] }),
    ]);
  };
  const create = useMutation({ mutationFn: hrProjectsServer.create, onSuccess: refreshProjects });
  const update = useMutation({
    mutationFn: ({ id, input }: HrProjectUpdate) => hrProjectsServer.update(id, input),
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

  const updateAssignment = (index: number, patch: ProjectAssignmentPatch) => {
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
      <HrHeader
        title="Assign projects"
        description="Build project teams and manage timelines, roles and progress."
        action={
          <button
            type="button"
            onClick={openCreate}
            disabled={!employees.length && !api.projects.isLoading}
            className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
          >
            <Plus className="size-4" />
            Assign project
          </button>
        }
      />

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
        <SearchInput
          wrapperClassName="relative block w-full lg:max-w-sm"
          iconClassName="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          value={projectsQuery.searchTerm}
          onChange={(event) => {
            projectsQuery.setSearchTerm(event.target.value);
            setPage(1);
          }}
          placeholder="Search project or employee..."
          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-emerald-400 focus:bg-white"
        />
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

      <HrProjectDetailsDialog
        viewTarget={viewTarget}
        onClose={() => setViewTarget(null)}
        onEdit={(project) => {
          openEdit(project);
          setViewTarget(null);
        }}
      />
      <HrProjectEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editing={editing}
        form={form}
        onFormChange={setForm}
        employees={employees}
        onSubmit={save}
        onAddAssignment={addAssignment}
        onUpdateAssignment={updateAssignment}
        onRemoveAssignment={removeAssignment}
        isSaving={saving}
      />

      <DeleteModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onDelete={() => void remove()}
        isDeleting={api.remove.isPending}
        title="Delete assigned project?"
        description={
          <>
            “{deleteTarget?.name}” and all of its employee assignments will be permanently removed.
          </>
        }
        confirmLabel="Delete project"
      />
    </section>
  );
}
