'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type {
  FieldErrors,
  SubmitHandler,
  UseFormHandleSubmit,
  UseFormRegister,
} from 'react-hook-form';
import type { LeaveRequestInput } from '@/types/leave.types';

type LeaveRequestDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  employeeId?: string;
  handleSubmit: UseFormHandleSubmit<LeaveRequestInput>;
  onSubmit: SubmitHandler<LeaveRequestInput>;
  register: UseFormRegister<LeaveRequestInput>;
  errors: FieldErrors<LeaveRequestInput>;
  busy: boolean;
};

export function LeaveRequestDialog({
  open,
  onOpenChange,
  isEditing,
  employeeId,
  handleSubmit,
  onSubmit,
  register,
  errors,
  busy,
}: LeaveRequestDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-[1px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-sky-100 bg-white p-5 shadow-2xl sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-bold text-slate-800">
                {isEditing ? 'Edit leave request' : 'Leave request'}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-slate-500">
                Submit the required leave information for review.
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              Employee ID
              <input
                value={employeeId ?? 'Loading…'}
                readOnly
                className="mt-1.5 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Leave type
              <select
                {...register('leaveType')}
                className="mt-1.5 w-full rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-3 text-sm text-slate-700 outline-none focus:ring-4 focus:ring-sky-100"
              >
                <option value="">Select leave type</option>
                <option>Annual leave</option>
                <option>Sick leave</option>
                <option>Casual leave</option>
                <option>Emergency leave</option>
              </select>
              {errors.leaveType && (
                <span className="mt-1 block text-xs text-rose-600">{errors.leaveType.message}</span>
              )}
            </label>
            <label className="text-sm font-medium text-slate-700">
              Leave start date
              <input
                {...register('startDate')}
                type="date"
                className="mt-1.5 w-full rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-3 text-sm text-slate-700 outline-none focus:ring-4 focus:ring-sky-100"
              />
              {errors.startDate && (
                <span className="mt-1 block text-xs text-rose-600">{errors.startDate.message}</span>
              )}
            </label>
            <label className="text-sm font-medium text-slate-700">
              Leave end date
              <input
                {...register('endDate')}
                type="date"
                className="mt-1.5 w-full rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-3 text-sm text-slate-700 outline-none focus:ring-4 focus:ring-sky-100"
              />
              {errors.endDate && (
                <span className="mt-1 block text-xs text-rose-600">{errors.endDate.message}</span>
              )}
            </label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              Reason
              <textarea
                {...register('reason')}
                rows={4}
                placeholder="Tell us why you need leave"
                className="mt-1.5 w-full resize-none rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-3 text-sm text-slate-700 outline-none focus:ring-4 focus:ring-sky-100"
              />
              {errors.reason && (
                <span className="mt-1 block text-xs text-rose-600">{errors.reason.message}</span>
              )}
            </label>
            <button
              disabled={busy}
              className="w-full rounded-xl bg-sky-100 py-3 font-semibold text-sky-700 disabled:opacity-60 sm:col-span-2"
            >
              {busy ? 'Saving request…' : isEditing ? 'Save changes' : 'Submit leave request'}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
