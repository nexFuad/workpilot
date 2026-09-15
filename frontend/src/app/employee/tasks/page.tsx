'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle, Clock3, ListTodo, Search } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { EmployeeHeader } from '@/components/employee/EmployeeHeader';
import { useSearchBar } from '@/hooks/use-search-bar';
import { tasksServer } from '@/server/tasks.server';
import type { TaskStatus } from '@/types/task.types';

const statusLabel: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  completed: 'Completed',
};
const priorityStyle: Record<string, string> = {
  high: 'bg-rose-100 text-rose-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-sky-100 text-sky-700',
};
const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
        new Date(value),
      )
    : 'No due date';

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | TaskStatus>('all');
  const tasks = useSearchBar({
    queryKey: ['tasks', { status: filter, limit: 50 }],
    queryFn: (search) => tasksServer.list({ status: filter, limit: 50, search }),
  });
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      tasksServer.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
  const visibleTasks = tasks.data?.tasks ?? [];
  const summary = tasks.data?.summary;
  const changeStatus = async (id: string, status: TaskStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Task marked as ${statusLabel[status].toLowerCase()}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Task update failed.');
    }
  };
  return (
    <section className="w-full space-y-6 pb-8">
      <EmployeeHeader
        title="My tasks"
        description="Track assigned work, update progress, and stay ahead of due dates."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-sky-100 bg-linear-to-br from-sky-600 to-cyan-500 p-5 text-white shadow-sm">
          <div className="flex justify-between">
            <p className="text-sm font-medium text-sky-100">Open tasks</p>
            <ListTodo className="size-5" />
          </div>
          {tasks.isLoading ? (
            <span className="mt-5 block h-7 w-16 animate-pulse rounded bg-white/25" />
          ) : (
            <p className="mt-5 text-2xl font-bold">{summary?.open ?? 0}</p>
          )}
          <p className="mt-1 text-xs text-sky-100">Tasks needing your attention</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex justify-between">
            <p className="text-sm font-medium text-slate-500">In progress</p>
            <Clock3 className="size-5 text-amber-600" />
          </div>
          {tasks.isLoading ? (
            <span className="mt-5 block h-7 w-16 animate-pulse rounded bg-slate-100" />
          ) : (
            <p className="mt-5 text-2xl font-bold text-slate-800">{summary?.inProgress ?? 0}</p>
          )}
          <p className="mt-1 text-xs text-slate-500">Work currently underway</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex justify-between">
            <p className="text-sm font-medium text-slate-500">Completed</p>
            <CheckCircle2 className="size-5 text-emerald-600" />
          </div>
          {tasks.isLoading ? (
            <span className="mt-5 block h-7 w-16 animate-pulse rounded bg-slate-100" />
          ) : (
            <p className="mt-5 text-2xl font-bold text-slate-800">{summary?.completed ?? 0}</p>
          )}
          {tasks.isLoading ? (
            <span className="mt-2 block h-3 w-36 animate-pulse rounded bg-slate-100" />
          ) : (
            <p className="mt-1 text-xs text-slate-500">
              Out of {summary?.total ?? 0} assigned tasks
            </p>
          )}
        </article>
      </div>
      <div>
        <label className="relative block w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-sky-600" />
          <input
            type="search"
            value={tasks.searchTerm}
            onChange={(event) => tasks.setSearchTerm(event.target.value)}
            placeholder="Search task title or description..."
            className="h-11 w-full rounded-xl border border-sky-100 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
          />
        </label>
        {tasks.isFetching && !tasks.isLoading ? (
          <p className="mt-2 text-xs font-medium text-slate-500">Searching tasks…</p>
        ) : null}
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-slate-800">Task board</h2>
            <p className="mt-1 text-sm text-slate-500">Choose a status to update your progress.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'todo', 'in_progress', 'completed'] as const).map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${filter === item ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {item === 'all' ? 'All' : statusLabel[item]}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {tasks.isLoading ? (
            Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="animate-pulse p-5">
                <div className="flex gap-4">
                  <span className="size-6 rounded-full bg-slate-100" />
                  <div className="flex-1 space-y-3">
                    <span className="block h-4 w-1/3 rounded bg-slate-100" />
                    <span className="block h-3 w-3/4 rounded bg-slate-100" />
                    <span className="block h-9 w-full rounded-xl bg-slate-100" />
                  </div>
                </div>
              </div>
            ))
          ) : visibleTasks.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              {tasks.debouncedSearch
                ? 'No task matched your search.'
                : 'No tasks in this category.'}
            </p>
          ) : (
            visibleTasks.map((task) => (
              <article key={task.id} className="p-5">
                <div className="flex gap-4">
                  <button
                    onClick={() =>
                      changeStatus(task.id, task.status === 'completed' ? 'todo' : 'completed')
                    }
                    aria-label="Toggle task completion"
                    className="mt-0.5 text-sky-600"
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="size-6" />
                    ) : (
                      <Circle className="size-6" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3
                          className={`font-semibold ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800'}`}
                        >
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="mt-1 text-sm leading-6 text-slate-500">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${priorityStyle[task.priority]}`}
                      >
                        {task.priority} priority
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs font-medium text-slate-500">
                        Due: {formatDate(task.dueDate)}
                      </p>
                      <select
                        value={task.status}
                        disabled={updateStatus.isPending}
                        onChange={(event) =>
                          changeStatus(task.id, event.target.value as TaskStatus)
                        }
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-sky-400"
                      >
                        {(['todo', 'in_progress', 'completed'] as TaskStatus[]).map((status) => (
                          <option key={status} value={status}>
                            {statusLabel[status]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </section>
  );
}
