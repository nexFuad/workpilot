'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { FolderKanban, LoaderCircle, Trash2, UserPlus, X } from 'lucide-react';
import type { Dispatch, FormEventHandler, SetStateAction } from 'react';
import { SoftSelect } from '@/components/ui/SoftSelect';
import type {
  HrProject,
  HrProjectInput,
  ProjectAssignmentPatch,
  ProjectEmployee,
  ProjectStatus,
} from '@/types/hr-project.types';

const fieldClass =
  'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100';

type HrProjectEditorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: HrProject | null;
  form: HrProjectInput;
  onFormChange: Dispatch<SetStateAction<HrProjectInput>>;
  employees: ProjectEmployee[];
  onSubmit: FormEventHandler<HTMLFormElement>;
  onAddAssignment: () => void;
  onUpdateAssignment: (index: number, patch: ProjectAssignmentPatch) => void;
  onRemoveAssignment: (index: number) => void;
  isSaving: boolean;
};

export function HrProjectEditorDialog({
  open,
  onOpenChange,
  editing,
  form,
  onFormChange,
  employees,
  onSubmit,
  onAddAssignment,
  onUpdateAssignment,
  onRemoveAssignment,
  isSaving,
}: HrProjectEditorDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
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

          <form onSubmit={onSubmit} className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-bold text-slate-700 sm:col-span-2">
              Project name
              <input
                required
                minLength={3}
                maxLength={160}
                value={form.name}
                onChange={(event) => onFormChange({ ...form, name: event.target.value })}
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
                onChange={(event) => onFormChange({ ...form, description: event.target.value })}
                placeholder="Describe the goal, expected deliverables and project scope..."
                className={`${fieldClass} resize-none leading-6`}
              />
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Project status
              <SoftSelect
                value={form.status}
                onValueChange={(value) => onFormChange({ ...form, status: value as ProjectStatus })}
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
                  onChange={(event) =>
                    onFormChange({ ...form, progress: Number(event.target.value) })
                  }
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
                onChange={(event) => onFormChange({ ...form, startDate: event.target.value })}
                className={fieldClass}
              />
            </label>

            <label className="block text-sm font-bold text-slate-700">
              End date
              <input
                type="date"
                min={form.startDate || undefined}
                value={form.endDate}
                onChange={(event) => onFormChange({ ...form, endDate: event.target.value })}
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
                  onClick={onAddAssignment}
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
                          onValueChange={(value) => onUpdateAssignment(index, { userId: value })}
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
                            onUpdateAssignment(index, { role: event.target.value })
                          }
                          placeholder="e.g. Designer"
                          className={fieldClass}
                        />
                      </label>
                      <button
                        type="button"
                        aria-label="Remove team member"
                        onClick={() => onRemoveAssignment(index)}
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
                disabled={isSaving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {isSaving ? (
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
  );
}
