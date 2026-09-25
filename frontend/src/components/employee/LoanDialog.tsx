'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { FormEventHandler } from 'react';

type LoanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: string;
  onAmountChange: (value: string) => void;
  tenure: string;
  onTenureChange: (value: string) => void;
  purpose: string;
  onPurposeChange: (value: string) => void;
  formattedMonthlyInstallment: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function LoanDialog({
  open,
  onOpenChange,
  amount,
  onAmountChange,
  tenure,
  onTenureChange,
  purpose,
  onPurposeChange,
  formattedMonthlyInstallment,
  onSubmit,
}: LoanDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-bold text-slate-900">
                Request a loan
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-slate-500">
                Submit your requirements for HR approval.
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Close loan form"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Loan amount
              <input
                value={amount}
                onChange={(event) => onAmountChange(event.target.value)}
                type="number"
                min="10000"
                max="300000"
                placeholder="e.g. 100000"
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Repayment period
              <select
                value={tenure}
                onChange={(event) => onTenureChange(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              >
                <option value="3">3 months</option>
                <option value="6">6 months</option>
                <option value="12">12 months</option>
                <option value="18">18 months</option>
                <option value="24">24 months</option>
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Loan purpose
              <textarea
                value={purpose}
                onChange={(event) => onPurposeChange(event.target.value)}
                rows={3}
                placeholder="Briefly explain why you need the loan"
                className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
            </label>
            {Number(amount) > 0 && (
              <p className="rounded-lg bg-sky-50 p-3 text-sm text-sky-800">
                Estimated monthly deduction: <strong>{formattedMonthlyInstallment}</strong>
              </p>
            )}
            <button
              type="submit"
              className="w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700"
            >
              Submit loan request
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
