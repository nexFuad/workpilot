'use client';
import { CheckCircle2, Circle, Clock3, ListTodo } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { EmployeeHeader } from '@/components/employee/EmployeeHeader';
import { useTasks } from '@/hooks/use-tasks';
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
  const [filter, setFilter] = useState<'all' | TaskStatus>('all');
  const { tasks, updateStatus } = useTasks();
  const allTasks = tasks.data?.tasks ?? [];
  const visibleTasks =
    filter === 'all' ? allTasks : allTasks.filter((task) => task.status === filter);
  const completed = allTasks.filter((task) => task.status === 'completed').length;
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
        <article className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-600 to-cyan-500 p-5 text-white shadow-sm">
          <div className="flex justify-between">
            <p className="text-sm font-medium text-sky-100">Open tasks</p>
            <ListTodo className="size-5" />
          </div>
          <p className="mt-5 text-2xl font-bold">
            {allTasks.filter((task) => task.status !== 'completed').length}
          </p>
          <p className="mt-1 text-xs text-sky-100">Tasks needing your attention</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex justify-between">
            <p className="text-sm font-medium text-slate-500">In progress</p>
            <Clock3 className="size-5 text-amber-600" />
          </div>
          <p className="mt-5 text-2xl font-bold text-slate-800">
            {allTasks.filter((task) => task.status === 'in_progress').length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Work currently underway</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex justify-between">
            <p className="text-sm font-medium text-slate-500">Completed</p>
            <CheckCircle2 className="size-5 text-emerald-600" />
          </div>
          <p className="mt-5 text-2xl font-bold text-slate-800">{completed}</p>
          <p className="mt-1 text-xs text-slate-500">Out of {allTasks.length} assigned tasks</p>
        </article>
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
            <p className="p-6 text-sm text-slate-500">Loading tasks…</p>
          ) : visibleTasks.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">No tasks in this category.</p>
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
