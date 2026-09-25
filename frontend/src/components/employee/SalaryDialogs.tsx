'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Download, X } from 'lucide-react';
import type { FormEventHandler } from 'react';
import type { SalaryRecord } from '@/types/compensation.types';

export const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
export function DetailRow({
  label,
  value,
  deduction = false,
}: {
  label: string;
  value: number;
  deduction?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={`font-semibold ${deduction ? 'text-rose-600' : 'text-slate-800'}`}>
        {deduction ? '−' : ''}
        {currency.format(value)}
      </span>
    </div>
  );
}

type PayslipDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: SalaryRecord;
  finalPayable: number;
  approvedAdvance: number;
  activeLoanInstallment: number;
  onPrint: () => void;
};

type SalaryAdvanceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: SalaryRecord;
  maximumAmount: number;
  advanceAmount: string;
  onAmountChange: (value: string) => void;
  advanceReason: string;
  onReasonChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function PayslipDialog({
  open,
  onOpenChange,
  selected,
  finalPayable,
  approvedAdvance,
  activeLoanInstallment,
  onPrint,
}: PayslipDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        >
          <div className="flex items-start justify-between gap-5">
            <div>
              <Dialog.Title className="text-xl font-bold text-slate-900">Payslip</Dialog.Title>
              <p className="mt-1 text-sm text-slate-500">
                {selected.month} · {selected.period}
              </p>
            </div>
            <Dialog.Close
              aria-label="Close payslip"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Net salary credited
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {currency.format(finalPayable)}
            </p>
            <p className="mt-1 text-sm text-slate-500">Paid on {selected.paidOn}</p>
          </div>
          <div className="mt-5 divide-y divide-slate-100">
            <DetailRow label="Basic salary" value={selected.basic} />
            <DetailRow label="Allowances" value={selected.allowances} />
            {selected.bonus > 0 && <DetailRow label="Bonus" value={selected.bonus} />}
            <DetailRow label="Income tax" value={selected.tax} deduction />
            <DetailRow label="Provident fund" value={selected.providentFund} deduction />
            {approvedAdvance > 0 && (
              <DetailRow label="Salary advance adjustment" value={approvedAdvance} deduction />
            )}
            <DetailRow label="Loan instalment" value={activeLoanInstallment} deduction />
          </div>
          <button
            onClick={onPrint}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700"
          >
            <Download className="size-4" />
            Download / print payslip
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function SalaryAdvanceDialog({
  open,
  onOpenChange,
  selected,
  maximumAmount,
  advanceAmount,
  onAmountChange,
  advanceReason,
  onReasonChange,
  onSubmit,
}: SalaryAdvanceDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-bold text-slate-900">
                Request salary advance
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-slate-500">
                For {selected.month}. Maximum request: {currency.format(maximumAmount)}
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Close request form"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Advance amount
              <input
                value={advanceAmount}
                onChange={(event) => onAmountChange(event.target.value)}
                type="number"
                min="1000"
                max={maximumAmount}
                placeholder="e.g. 5000"
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Reason
              <textarea
                value={advanceReason}
                onChange={(event) => onReasonChange(event.target.value)}
                rows={3}
                placeholder="Briefly explain why you need the advance"
                className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
            </label>
            <p className="rounded-lg bg-sky-50 p-3 text-xs leading-5 text-sky-800">
              After HR approval, this amount will be deducted from your {selected.month} net salary.
            </p>
            <button
              type="submit"
              className="w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700"
            >
              Submit request
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
