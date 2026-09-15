'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Download,
  FileText,
  HandCoins,
  Plus,
  ReceiptText,
  WalletCards,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { EmployeeHeader } from '@/components/employee/EmployeeHeader';
import { compensationServer } from '@/server/compensation.server';

type SalaryRecord = {
  month: string;
  period: string;
  paidOn: string | null;
  basic: number;
  allowances: number;
  bonus: number;
  tax: number;
  providentFund: number;
  status: string;
};
type AdvanceRequest = {
  id: string;
  amount: number;
  reason: string;
  requestedOn: string;
  settlementMonth: string;
  status: 'Pending' | 'Approved' | 'Rejected';
};
const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const takeHome = (record: SalaryRecord) =>
  record.basic + record.allowances + record.bonus - record.tax - record.providentFund;

function DetailRow({
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

export default function SalaryPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'salary' | 'advance'>('salary');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [payslipOpen, setPayslipOpen] = useState(false);
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceReason, setAdvanceReason] = useState('');
  const salary = useQuery({
    queryKey: ['compensation', 'salary', selectedMonth],
    queryFn: () => compensationServer.salary(selectedMonth),
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });
  const createAdvance = useMutation({
    mutationFn: compensationServer.createAdvance,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['compensation'] }),
  });
  const records: SalaryRecord[] =
    salary.data?.payments.map((payment) => ({
      ...payment,
      status: payment.status === 'paid' ? 'Paid' : 'Upcoming',
      paidOn: payment.paidOn ?? null,
    })) ?? [];
  const advanceItems: AdvanceRequest[] =
    salary.data?.advances.map((advance) => ({
      ...advance,
      requestedOn: new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
        new Date(advance.createdAt),
      ),
      status: (advance.status[0].toUpperCase() +
        advance.status.slice(1)) as AdvanceRequest['status'],
    })) ?? [];
  const activeLoanInstallment = salary.data?.activeLoanInstallment ?? 0;
  const selected = salary.data?.selectedPayment
    ? ({
        ...salary.data.selectedPayment,
        status: salary.data.selectedPayment.status === 'paid' ? 'Paid' : 'Upcoming',
      } as SalaryRecord)
    : undefined;
  if (salary.isLoading) {
    return (
      <section className="w-full space-y-6 pb-8">
        <EmployeeHeader
          title="Salary & payslips"
          description="Track your monthly earnings, deductions, and payment history."
        />
        <div className="grid animate-pulse gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="h-32 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <span className="block h-4 w-32 rounded bg-slate-100" />
              <span className="mt-7 block h-7 w-40 rounded bg-slate-100" />
            </div>
          ))}
        </div>
        <div className="grid animate-pulse gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="h-96 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="block h-5 w-48 rounded bg-slate-100" />
            <span className="mt-6 block h-72 w-full rounded-xl bg-slate-100" />
          </div>
          <div className="h-96 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="block h-5 w-36 rounded bg-slate-100" />
            <span className="mt-6 block h-64 w-full rounded-xl bg-slate-100" />
          </div>
        </div>
      </section>
    );
  }
  if (!selected) {
    return (
      <section className="w-full space-y-6 pb-8">
        <EmployeeHeader
          title="Salary & payslips"
          description="Track your monthly earnings, deductions, and payment history."
        />
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
          No payroll record is available for your account yet.
        </div>
      </section>
    );
  }
  const grossPay = selected.basic + selected.allowances + selected.bonus;
  const deductions = selected.tax + selected.providentFund;
  const approvedAdvance = salary.data?.approvedAdvanceAmount ?? 0;
  const finalPayable = takeHome(selected) - approvedAdvance - activeLoanInstallment;
  const isUpcoming = selected.status === 'Upcoming';
  const openPayslip = () => {
    if (isUpcoming)
      return toast.message('This payslip will be available once the payment is processed.');
    setPayslipOpen(true);
  };
  const submitAdvance = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(advanceAmount);
    if (!amount || amount < 1000) return toast.error('Enter an advance amount of at least $1,000.');
    if (amount > takeHome(selected))
      return toast.error('Advance amount cannot exceed your net salary.');
    if (!advanceReason.trim())
      return toast.error('Please provide a short reason for your request.');
    try {
      await createAdvance.mutateAsync({
        amount,
        reason: advanceReason.trim(),
        settlementMonth: selected.month,
      });
      setAdvanceAmount('');
      setAdvanceReason('');
      setAdvanceOpen(false);
      toast.success('Your salary advance request has been sent to HR.');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Advance request could not be submitted.',
      );
    }
  };

  return (
    <section className="w-full space-y-6 pb-8">
      <EmployeeHeader
        title="Salary & payslips"
        description="Track your monthly earnings, deductions, and payment history."
      />
      <div className="flex w-fit rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        <button
          onClick={() => setActiveTab('salary')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${activeTab === 'salary' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Salary
        </button>
        <button
          onClick={() => setActiveTab('advance')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${activeTab === 'advance' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Salary advance
        </button>
      </div>
      {activeTab === 'salary' ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <article className="rounded-2xl border border-sky-100 bg-linear-to-br from-sky-600 to-cyan-500 p-5 text-white shadow-sm shadow-sky-200">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-sky-100">Expected take-home</p>
                <WalletCards className="size-5 text-sky-100" />
              </div>
              <p className="mt-5 text-2xl font-bold tracking-tight">
                {currency.format(finalPayable)}
              </p>
              <p className="mt-1 text-xs text-sky-100">For {selected.month}</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">Gross earnings</p>
                <ReceiptText className="size-5 text-sky-600" />
              </div>
              <p className="mt-5 text-2xl font-bold tracking-tight text-slate-800">
                {currency.format(grossPay)}
              </p>
              <p className="mt-1 text-xs text-slate-500">Basic, allowances & bonus</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">Total deductions</p>
                <FileText className="size-5 text-rose-500" />
              </div>
              <p className="mt-5 text-2xl font-bold tracking-tight text-slate-800">
                {currency.format(deductions)}
              </p>
              <p className="mt-1 text-xs text-slate-500">Tax & provident fund</p>
            </article>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-bold text-slate-800">Monthly salary summary</h2>
                  <p className="mt-1 text-sm text-slate-500">Your selected payroll period</p>
                </div>
                <label className="relative block">
                  <span className="sr-only">Select salary month</span>
                  <select
                    value={selectedMonth || selected.month}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                    className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-9 text-sm font-semibold text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  >
                    {records.map((record) => (
                      <option key={record.month}>{record.month}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-slate-400" />
                </label>
              </div>
              <div className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-sky-100 text-sky-700">
                      <CalendarDays className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{selected.period}</p>
                      <p className="mt-0.5 text-xs text-slate-500">Payroll period</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${isUpcoming ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}
                  >
                    {selected.status}
                  </span>
                </div>
                <div className="mt-3 divide-y divide-slate-100">
                  <DetailRow label="Basic salary" value={selected.basic} />
                  <DetailRow label="Allowances" value={selected.allowances} />
                  {selected.bonus > 0 && <DetailRow label="Bonus" value={selected.bonus} />}
                  <DetailRow label="Income tax" value={selected.tax} deduction />
                  <DetailRow label="Provident fund" value={selected.providentFund} deduction />
                  {approvedAdvance > 0 && (
                    <DetailRow
                      label="Salary advance adjustment"
                      value={approvedAdvance}
                      deduction
                    />
                  )}
                  <DetailRow label="Loan instalment" value={activeLoanInstallment} deduction />
                </div>
                <div className="mt-3 flex items-center justify-between rounded-xl bg-sky-50 px-4 py-4">
                  <span className="font-bold text-sky-950">Net salary</span>
                  <span className="text-xl font-bold text-sky-700">
                    {currency.format(finalPayable)}
                  </span>
                </div>
              </div>
            </article>
            <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-slate-800">Payment status</h2>
              <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <span
                  className={`grid size-11 place-items-center rounded-full ${isUpcoming ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}
                >
                  <CheckCircle2 className="size-6" />
                </span>
                <p className="mt-4 font-bold text-slate-800">
                  {isUpcoming ? 'Payment scheduled' : 'Payment completed'}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {isUpcoming ? `Expected on ${selected.paidOn}` : `Paid on ${selected.paidOn}`}
                </p>
                <button
                  onClick={openPayslip}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  <FileText className="size-4" />
                  View payslip
                </button>
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-400">
                Need help with a salary entry? Contact your HR team.
              </p>
            </aside>
          </div>
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h2 className="font-bold text-slate-800">Payment history</h2>
              <p className="mt-1 text-sm text-slate-500">Access your most recent salary records.</p>
            </div>
            <div className="divide-y divide-slate-100">
              {records.map((record) => (
                <div
                  key={record.month}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{record.month}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {record.status === 'Paid'
                        ? `Paid ${record.paidOn}`
                        : `Scheduled for ${record.paidOn}`}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-5 sm:justify-end">
                    <span className="font-bold text-slate-800">
                      {currency.format(takeHome(record))}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedMonth(record.month);
                        if (record.status === 'Paid') {
                          setPayslipOpen(true);
                        } else {
                          toast.message(
                            'This payslip will be available once the payment is processed.',
                          );
                        }
                      }}
                      className="rounded-lg px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50"
                    >
                      {record.status === 'Paid' ? 'View payslip' : 'Pending'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="grid size-11 place-items-center rounded-xl bg-sky-100 text-sky-700">
                  <HandCoins className="size-5" />
                </span>
                <h2 className="mt-4 text-lg font-bold text-slate-800">Salary advance</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Request a portion of your upcoming salary. Once HR approves it, the amount is
                  automatically adjusted from that month’s payable salary.
                </p>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-sky-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
                  Eligible salary
                </p>
                <p className="mt-2 text-xl font-bold text-slate-800">
                  {currency.format(takeHome(selected))}
                </p>
                <p className="mt-1 text-xs text-slate-500">{selected.month}</p>
              </div>
              <div className="rounded-xl bg-amber-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Approved advance
                </p>
                <p className="mt-2 text-xl font-bold text-slate-800">
                  {currency.format(approvedAdvance)}
                </p>
                <p className="mt-1 text-xs text-slate-500">Deducted from this payroll</p>
              </div>
            </div>
            <button
              onClick={() => setAdvanceOpen(true)}
              className="mt-6 flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700"
            >
              <Plus className="size-4" />
              Request salary advance
            </button>
          </article>
          <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-slate-800">How it works</h2>
            <ol className="mt-5 space-y-4 text-sm leading-6 text-slate-600">
              <li>
                <span className="mr-2 font-bold text-sky-600">01</span>Submit your amount and
                reason.
              </li>
              <li>
                <span className="mr-2 font-bold text-sky-600">02</span>HR reviews and approves the
                request.
              </li>
              <li>
                <span className="mr-2 font-bold text-sky-600">03</span>Approved amount is deducted
                from the selected month’s salary.
              </li>
            </ol>
          </aside>
          <article className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
            <div className="border-b border-slate-100 p-5">
              <h2 className="font-bold text-slate-800">Advance request history</h2>
              <p className="mt-1 text-sm text-slate-500">Track the status of every request.</p>
            </div>
            <div className="divide-y divide-slate-100">
              {advanceItems.map((advance) => (
                <div
                  key={advance.id}
                  className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {currency.format(advance.amount)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {advance.reason} · Requested {advance.requestedOn}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500">For {advance.settlementMonth}</span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${advance.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : advance.status === 'Rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}
                    >
                      {advance.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}
      <Dialog.Root open={payslipOpen} onOpenChange={setPayslipOpen}>
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
              onClick={() => {
                window.print();
                toast.success('Print dialog opened for your payslip.');
              }}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700"
            >
              <Download className="size-4" />
              Download / print payslip
            </button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root open={advanceOpen} onOpenChange={setAdvanceOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-xl font-bold text-slate-900">
                  Request salary advance
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-slate-500">
                  For {selected.month}. Maximum request: {currency.format(takeHome(selected))}
                </Dialog.Description>
              </div>
              <Dialog.Close
                aria-label="Close request form"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="size-5" />
              </Dialog.Close>
            </div>
            <form onSubmit={submitAdvance} className="mt-6 space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                Advance amount
                <input
                  value={advanceAmount}
                  onChange={(event) => setAdvanceAmount(event.target.value)}
                  type="number"
                  min="1000"
                  max={takeHome(selected)}
                  placeholder="e.g. 5000"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Reason
                <textarea
                  value={advanceReason}
                  onChange={(event) => setAdvanceReason(event.target.value)}
                  rows={3}
                  placeholder="Briefly explain why you need the advance"
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                />
              </label>
              <p className="rounded-lg bg-sky-50 p-3 text-xs leading-5 text-sky-800">
                After HR approval, this amount will be deducted from your {selected.month} net
                salary.
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
    </section>
  );
}
