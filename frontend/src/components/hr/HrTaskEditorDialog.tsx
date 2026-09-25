'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { ClipboardCheck, LoaderCircle, X } from 'lucide-react';
import type { Dispatch, FormEventHandler, SetStateAction } from 'react';
import { SoftSelect } from '@/components/ui/SoftSelect';
import type { HrTask, HrTaskEmployee, HrTaskInput, TaskPriority } from '@/types/hr-task.types';
import type { TaskStatus } from '@/types/task.types';

const fieldClass =
  'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100';

type HrTaskEditorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: HrTask | null;
  form: HrTaskInput;
  onFormChange: Dispatch<SetStateAction<HrTaskInput>>;
  employees: HrTaskEmployee[];
  onSubmit: FormEventHandler<HTMLFormElement>;
  isSaving: boolean;
};

export function HrTaskEditorDialog({
  open,
  onOpenChange,
  editing,
  form,
  onFormChange,
  employees,
  onSubmit,
  isSaving,
}: HrTaskEditorDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
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

          <form onSubmit={onSubmit} className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-bold text-slate-700 sm:col-span-2">
              Assign to employee
              <SoftSelect
                value={form.userId || undefined}
                onValueChange={(value) => onFormChange({ ...form, userId: value })}
                placeholder="Select an employee"
                tone="emerald"
                options={employees.map((employee) => ({
                  value: employee.id,
                  label: `${employee.fullName || employee.employeeId} · ${employee.employeeId}`,
                }))}
              />
            </label>

            <label className="block text-sm font-bold text-slate-700 sm:col-span-2">
              Task title
              <input
                required
                minLength={3}
                maxLength={160}
                value={form.title}
                onChange={(event) => onFormChange({ ...form, title: event.target.value })}
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
                onChange={(event) => onFormChange({ ...form, description: event.target.value })}
                placeholder="Add requirements, expected output and necessary instructions..."
                className={`${fieldClass} resize-none leading-6`}
              />
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Priority
              <SoftSelect
                value={form.priority}
                onValueChange={(value) =>
                  onFormChange({ ...form, priority: value as TaskPriority })
                }
                placeholder="Select priority"
                tone="emerald"
                options={[
                  { value: 'low', label: 'Low priority' },
                  { value: 'medium', label: 'Medium priority' },
                  { value: 'high', label: 'High priority' },
                ]}
              />
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Deadline
              <input
                type="date"
                value={form.dueDate}
                onChange={(event) => onFormChange({ ...form, dueDate: event.target.value })}
                className={fieldClass}
              />
            </label>

            <label className="block text-sm font-bold text-slate-700 sm:col-span-2">
              Task status
              <SoftSelect
                value={form.status}
                onValueChange={(value) => onFormChange({ ...form, status: value as TaskStatus })}
                placeholder="Select task status"
                tone="emerald"
                options={[
                  { value: 'todo', label: 'To do' },
                  { value: 'in_progress', label: 'In progress' },
                  { value: 'completed', label: 'Completed' },
                ]}
              />
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
                disabled={isSaving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {isSaving ? (
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
  );
}
