'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { WalletCards, X } from 'lucide-react';
import type { Dispatch, FormEventHandler, SetStateAction } from 'react';
import type { PayrollInput } from '@/server/hr-payroll.server';

type PayrollForm = PayrollInput & { paidOn: string };

type HrPayrollDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: PayrollForm;
  onFormChange: Dispatch<SetStateAction<PayrollForm>>;
  employees?: { id: string; fullName: string | null; employeeId: string }[];
  formatMoney: (value: number) => string;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

const total = (form: PayrollForm) =>
  form.basic + form.allowances + form.bonus - form.tax - form.providentFund;

export function HrPayrollDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  employees,
  formatMoney,
  onSubmit,
}: HrPayrollDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/30" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex justify-between">
            <Dialog.Title className="text-xl font-bold">Create payroll</Dialog.Title>
            <Dialog.Close>
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <form onSubmit={onSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Employee
              <select
                required
                value={form.userId}
                onChange={(e) => onFormChange({ ...form, userId: e.target.value })}
                className="mt-1.5 w-full rounded-xl border p-3"
              >
                <option value="">Select employee</option>
                {employees?.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.fullName || e.employeeId}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold">
              Salary month
              <input
                required
                value={form.month}
                onChange={(e) => onFormChange({ ...form, month: e.target.value })}
                placeholder="September 2026"
                className="mt-1.5 w-full rounded-xl border p-3"
              />
            </label>
            <label className="text-sm font-semibold sm:col-span-2">
              Payroll period
              <input
                required
                value={form.period}
                onChange={(e) => onFormChange({ ...form, period: e.target.value })}
                placeholder="1–30 September 2026"
                className="mt-1.5 w-full rounded-xl border p-3"
              />
            </label>
            {(['basic', 'allowances', 'bonus', 'tax', 'providentFund'] as const).map((k) => (
              <label key={k} className="text-sm font-semibold capitalize">
                {k.replace(/([A-Z])/g, ' $1')}
                <input
                  type="number"
                  min="0"
                  value={form[k]}
                  onChange={(e) => onFormChange({ ...form, [k]: Number(e.target.value) })}
                  className="mt-1.5 w-full rounded-xl border p-3"
                />
              </label>
            ))}
            <label className="text-sm font-semibold">
              Payment status
              <select
                value={form.status}
                onChange={(e) =>
                  onFormChange({ ...form, status: e.target.value as 'paid' | 'upcoming' })
                }
                className="mt-1.5 w-full rounded-xl border p-3"
              >
                <option value="upcoming">Upcoming</option>
                <option value="paid">Paid</option>
              </select>
            </label>
            <div className="rounded-xl bg-emerald-50 p-4 sm:col-span-2">
              <p className="text-xs font-bold uppercase text-emerald-700">Estimated net salary</p>
              <p className="mt-1 text-xl font-bold text-emerald-800">{formatMoney(total(form))}</p>
            </div>
            <button className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 p-3 text-sm font-semibold text-white sm:col-span-2">
              <WalletCards className="size-4" />
              Save payroll
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
