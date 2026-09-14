'use client';

import * as Dialog from '@radix-ui/react-dialog';
import {
  CalendarClock,
  CheckCircle2,
  CircleDot,
  ClipboardCheck,
  Clock3,
  LoaderCircle,
  PencilLine,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Pagination } from '@/components/shared/Pagination';
import { useHrTasks } from '@/hooks/use-hr-tasks';
import type { HrTask, HrTaskInput, TaskPriority } from '@/types/hr-task.types';
import type { TaskStatus } from '@/types/task.types';

const emptyForm: HrTaskInput = {
  userId: '',
  title: '',
  description: '',
  priority: 'medium',
  status: 'todo',
  dueDate: '',
};

const statusLabel: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  completed: 'Completed',
};

const statusStyle: Record<TaskStatus, string> = {
  todo: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
};

const priorityStyle: Record<TaskPriority, string> = {
  low: 'bg-sky-50 text-sky-700',
  medium: 'bg-amber-50 text-amber-700',
  high: 'bg-rose-50 text-rose-700',
};

const fieldClass =
  'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100';

function toInput(task: HrTask): HrTaskInput {
  return {
    userId: task.userId,
    title: task.title,
    description: task.description ?? '',
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate?.slice(0, 10) ?? '',
  };
}

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(value))
    : 'No deadline';
}

function isOverdue(task: HrTask) {
  return Boolean(
    task.dueDate && task.status !== 'completed' && new Date(task.dueDate).getTime() < Date.now(),
  );
}

export default function HrTasksPage() {
  const api = useHrTasks();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'all' | TaskStatus>('all');
  const [search, setSearch] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<HrTask | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HrTask | null>(null);
  const [form, setForm] = useState<HrTaskInput>(emptyForm);

  const tasks = api.tasks.data?.tasks ?? [];
  const employees = api.tasks.data?.employees ?? [];
  const query = search.trim().toLowerCase();
  const filtered = tasks.filter((task) => {
    const matchesStatus = status === 'all' || task.status === status;
    const matchesSearch =
      !query ||
      task.title.toLowerCase().includes(query) ||
      task.user.employeeId.toLowerCase().includes(query) ||
      (task.user.fullName ?? '').toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / 10)));
  const visible = filtered.slice((currentPage - 1) * 10, currentPage * 10);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, userId: employees[0]?.id ?? '' });
    setEditorOpen(true);
  };

  const openEdit = (task: HrTask) => {
    setEditing(task);
    setForm(toInput(task));
    setEditorOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.userId) return toast.error('Select an employee.');
    try {
      if (editing) {
        await api.update.mutateAsync({ id: editing.id, input: form });
        toast.success('Task updated successfully.');
      } else {
        await api.create.mutateAsync(form);
        toast.success('Task assigned to the employee.');
      }
      setEditorOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Task could not be saved.');
    }
  };

  const changeStatus = async (task: HrTask, nextStatus: TaskStatus) => {
    try {
      await api.update.mutateAsync({
        id: task.id,
        input: { ...toInput(task), status: nextStatus },
      });
      toast.success(`Task moved to ${statusLabel[nextStatus].toLowerCase()}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Status could not be updated.');
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await api.remove.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      toast.success('Task deleted.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Task could not be deleted.');
    }
  };

  const saving = api.create.isPending || api.update.isPending;

  return (
    <section className="w-full space-y-6 pb-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
            HR workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-800">Assign tasks</h1>
          <p className="mt-2 text-sm text-slate-600">
            Assign work to employees and track progress from one place.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          disabled={!employees.length && !api.tasks.isLoading}
          className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          <Plus className="size-4" />
          Assign task
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total tasks', value: tasks.length, icon: ClipboardCheck },
          {
            label: 'To do',
            value: tasks.filter((task) => task.status === 'todo').length,
            icon: CircleDot,
          },
          {
            label: 'In progress',
            value: tasks.filter((task) => task.status === 'in_progress').length,
            icon: Clock3,
          },
          {
            label: 'Completed',
            value: tasks.filter((task) => task.status === 'completed').length,
            icon: CheckCircle2,
          },
        ].map(({ label, value, icon: Icon }) => (
          <article
            key={label}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <Icon className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-bold text-slate-800">{value}</p>
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
            placeholder="Search task or employee..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-emerald-400 focus:bg-white"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {(['all', 'todo', 'in_progress', 'completed'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setStatus(item);
                setPage(1);
              }}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition ${status === item ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {item === 'all' ? 'All tasks' : statusLabel[item]}
            </button>
          ))}
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-[70vh] overflow-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Employee</th>
                <th className="px-5 py-3">Task</th>
                <th className="px-5 py-3">Priority</th>
                <th className="px-5 py-3">Deadline</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {api.tasks.isLoading ? (
                Array.from({ length: 10 }, (_, row) => (
                  <tr key={row} className="animate-pulse">
                    {Array.from({ length: 6 }, (_, cell) => (
                      <td key={cell} className="px-5 py-5">
                        <span className="block h-4 w-24 rounded bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : api.tasks.isError ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-sm text-rose-600">
                    Tasks could not be loaded.
                  </td>
                </tr>
              ) : visible.length ? (
                visible.map((task) => (
                  <tr key={task.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                          <UserRound className="size-4" />
                        </span>
                        <div>
                          <p className="font-semibold text-slate-800">
                            {task.user.fullName || task.user.employeeId}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">{task.user.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-sm px-5 py-4">
                      <p className="font-semibold text-slate-800">{task.title}</p>
                      <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                        {task.description || 'No description'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${priorityStyle[task.priority]}`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-sm font-medium ${isOverdue(task) ? 'text-rose-600' : 'text-slate-600'}`}
                      >
                        <CalendarClock className="size-4" />
                        {formatDate(task.dueDate)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={task.status}
                        disabled={api.update.isPending}
                        onChange={(event) =>
                          void changeStatus(task, event.target.value as TaskStatus)
                        }
                        className={`rounded-lg border-0 px-2.5 py-2 text-xs font-bold outline-none ${statusStyle[task.status]}`}
                      >
                        {(['todo', 'in_progress', 'completed'] as TaskStatus[]).map((item) => (
                          <option key={item} value={item}>
                            {statusLabel[item]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(task)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
                        >
                          <PencilLine className="size-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(task)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-rose-50 px-3 text-xs font-bold text-rose-600 hover:bg-rose-100"
                        >
                          <Trash2 className="size-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-sm text-slate-500">
                    No tasks found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-5 py-4">
          <Pagination
            page={currentPage}
            totalItems={filtered.length}
            pageSize={10}
            onPageChange={setPage}
          />
        </div>
      </section>

      <Dialog.Root open={editorOpen} onOpenChange={setEditorOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[2px]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-2xl font-bold text-slate-800">
                  {editing ? 'Edit assigned task' : 'Assign a new task'}
                </Dialog.Title>
                <Dialog.Description className="mt-1.5 text-sm text-slate-500">
                  Select an employee and provide clear work instructions.
                </Dialog.Description>
              </div>
              <Dialog.Close className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200">
                <X className="size-4" />
              </Dialog.Close>
            </div>

            <form onSubmit={save} className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-bold text-slate-700 sm:col-span-2">
                Assign to employee
                <select
                  required
                  value={form.userId}
                  onChange={(event) => setForm({ ...form, userId: event.target.value })}
                  className={fieldClass}
                >
                  <option value="">Select an employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.fullName || employee.employeeId} · {employee.employeeId}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-bold text-slate-700 sm:col-span-2">
                Task title
                <input
                  required
                  minLength={3}
                  maxLength={160}
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  placeholder="e.g. Complete attendance report"
                  className={fieldClass}
                />
              </label>

              <label className="block text-sm font-bold text-slate-700 sm:col-span-2">
                Task description
                <textarea
                  rows={5}
                  maxLength={1200}
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  placeholder="Add requirements, expected output and necessary instructions..."
                  className={`${fieldClass} resize-none leading-6`}
                />
              </label>

              <label className="block text-sm font-bold text-slate-700">
                Priority
                <select
                  value={form.priority}
                  onChange={(event) =>
                    setForm({ ...form, priority: event.target.value as TaskPriority })
                  }
                  className={fieldClass}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>

              <label className="block text-sm font-bold text-slate-700">
                Deadline
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
                  className={fieldClass}
                />
              </label>

              <label className="block text-sm font-bold text-slate-700 sm:col-span-2">
                Task status
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({ ...form, status: event.target.value as TaskStatus })
                  }
                  className={fieldClass}
                >
                  <option value="todo">To do</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                </select>
              </label>

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
                    <ClipboardCheck className="size-4" />
                  )}
                  {editing ? 'Save changes' : 'Assign task'}
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
              Delete assigned task?
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-6 text-slate-500">
              “{deleteTarget?.title}” will be permanently removed from{' '}
              {deleteTarget?.user.fullName || deleteTarget?.user.employeeId}&apos;s task list.
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
                Delete task
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
