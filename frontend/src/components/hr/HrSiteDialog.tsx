'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { LoaderCircle, X } from 'lucide-react';
import type { Dispatch, FormEventHandler, SetStateAction } from 'react';
import type { Site } from '@/server/hr-settings.server';

const fieldClass =
  'mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100';

type SiteForm = Omit<Site, 'id'>;

type HrSiteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Site | null;
  form: SiteForm;
  onFormChange: Dispatch<SetStateAction<SiteForm>>;
  onSubmit: FormEventHandler<HTMLFormElement>;
  isSaving: boolean;
};

export function HrSiteDialog({
  open,
  onOpenChange,
  editing,
  form,
  onFormChange,
  onSubmit,
  isSaving,
}: HrSiteDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-2xl font-bold text-slate-800">
                {editing ? 'Edit site' : 'Create site'}
              </Dialog.Title>
              <Dialog.Description className="mt-1.5 text-sm text-slate-500">
                Add an attendance location for employees.
              </Dialog.Description>
            </div>
            <Dialog.Close className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200">
              <X className="size-4" />
            </Dialog.Close>
          </div>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block text-sm font-bold text-slate-700">
              Site name
              <input
                required
                value={form.name}
                onChange={(event) => onFormChange({ ...form, name: event.target.value })}
                placeholder="Enter site name"
                className={fieldClass}
              />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Location / address
              <input
                required
                value={form.location}
                onChange={(event) => onFormChange({ ...form, location: event.target.value })}
                placeholder="Enter location or address"
                className={fieldClass}
              />
            </label>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3.5">
              <div>
                <p className="text-sm font-bold text-slate-700">Active site</p>
                <p className="mt-0.5 text-xs text-slate-500">Available for attendance</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.isActive}
                onClick={() => onFormChange({ ...form, isActive: !form.isActive })}
                className={`relative h-5 w-9 rounded-full ${form.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <span
                  className={`absolute top-1 size-3 rounded-full bg-white transition ${form.isActive ? 'left-5' : 'left-1'}`}
                />
              </button>
            </div>
            <button
              disabled={isSaving}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {isSaving && <LoaderCircle className="size-4 animate-spin" />}
              {editing ? 'Save changes' : 'Create site'}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
