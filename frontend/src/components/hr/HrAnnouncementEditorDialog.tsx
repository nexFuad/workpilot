'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Check, LoaderCircle, Send, X } from 'lucide-react';
import type { Dispatch, FormEventHandler, SetStateAction } from 'react';
import type {
  AnnouncementPriority,
  HrAnnouncement,
  HrAnnouncementInput,
} from '@/types/hr-announcement.types';

const fieldClass =
  'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100';

type HrAnnouncementEditorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: HrAnnouncement | null;
  form: HrAnnouncementInput;
  onFormChange: Dispatch<SetStateAction<HrAnnouncementInput>>;
  onSubmit: FormEventHandler<HTMLFormElement>;
  isSaving: boolean;
};

export function HrAnnouncementEditorDialog({
  open,
  onOpenChange,
  editing,
  form,
  onFormChange,
  onSubmit,
  isSaving,
}: HrAnnouncementEditorDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-white/60 bg-white p-6 shadow-2xl sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-2xl font-bold text-slate-800">
                {editing ? 'Edit announcement' : 'Create announcement'}
              </Dialog.Title>
              <Dialog.Description className="mt-1.5 text-sm text-slate-500">
                {editing
                  ? 'Update the announcement details and visibility.'
                  : 'Share an important update with all employees.'}
              </Dialog.Description>
            </div>
            <Dialog.Close className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800">
              <X className="size-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-5">
            <label className="block text-sm font-bold text-slate-700">
              Announcement title
              <input
                required
                minLength={3}
                maxLength={160}
                placeholder="e.g. Office holiday notice"
                value={form.title}
                onChange={(event) => onFormChange({ ...form, title: event.target.value })}
                className={fieldClass}
              />
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Announcement message
              <textarea
                required
                minLength={5}
                maxLength={2000}
                rows={6}
                placeholder="Write the complete update for employees..."
                value={form.content}
                onChange={(event) => onFormChange({ ...form, content: event.target.value })}
                className={`${fieldClass} resize-none leading-6`}
              />
              <span className="mt-1.5 block text-right text-xs font-medium text-slate-400">
                {form.content.length}/2000
              </span>
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Priority
              <select
                value={form.priority}
                onChange={(event) =>
                  onFormChange({ ...form, priority: event.target.value as AnnouncementPriority })
                }
                className={fieldClass}
              >
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <span>
                  <span className="block text-sm font-bold text-slate-700">Active status</span>
                  <span className="mt-0.5 block text-xs text-slate-500">Visible to employees</span>
                </span>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => onFormChange({ ...form, isActive: event.target.checked })}
                  className="size-4 accent-emerald-600"
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <span>
                  <span className="block text-sm font-bold text-slate-700">Pin announcement</span>
                  <span className="mt-0.5 block text-xs text-slate-500">Keep it at the top</span>
                </span>
                <input
                  type="checkbox"
                  checked={form.isPinned}
                  onChange={(event) => onFormChange({ ...form, isPinned: event.target.checked })}
                  className="size-4 accent-emerald-600"
                />
              </label>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : editing ? (
                  <Check className="size-4" />
                ) : (
                  <Send className="size-4" />
                )}
                {editing ? 'Save changes' : 'Publish announcement'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
