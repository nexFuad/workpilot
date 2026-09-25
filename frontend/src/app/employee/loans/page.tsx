'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, CircleDollarSign, HandCoins, Plus, ReceiptText } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EmployeeHeader } from '@/components/employee/EmployeeHeader';
import { LoanDialog } from '@/components/employee/LoanDialog';
import { compensationServer } from '@/server/compensation.server';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export default function LoansPage() {
  const queryClient = useQueryClient();
  const [requestOpen, setRequestOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [tenure, setTenure] = useState('12');
  const loans = useQuery({
    queryKey: ['compensation', 'loans'],
    queryFn: compensationServer.loans,
  });
  const createLoan = useMutation({
    mutationFn: compensationServer.createLoan,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['compensation'] }),
  });
  const activeLoan = loans.data?.activeLoan;
  const requestHistory =
    loans.data?.requests.map((request) => ({
      ...request,
      requestedOn: new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
        new Date(request.createdAt),
      ),
      status: request.status[0].toUpperCase() + request.status.slice(1),
    })) ?? [];
  const monthlyInstallment = useMemo(
    () => Math.ceil(Number(amount || 0) / Number(tenure || 1)),
    [amount, tenure],
  );
  const paidAmount = (activeLoan?.principal ?? 0) - (activeLoan?.outstanding ?? 0);
  const progress = activeLoan?.principal ? (paidAmount / activeLoan.principal) * 100 : 0;
  const nextDue = activeLoan
    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(activeLoan.nextDue))
    : 'Not scheduled';

  if (loans.isLoading) {
    return (
      <section className="w-full space-y-6 pb-8">
        <EmployeeHeader
          title="Employee loans"
          description="Request a loan, follow its approval, and keep track of your repayments."
        />
        <div className="grid animate-pulse gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-32 rounded-2xl border border-slate-200 bg-white p-5">
              <span className="block h-4 w-32 rounded bg-slate-100" />
              <span className="mt-7 block h-7 w-40 rounded bg-slate-100" />
            </div>
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white p-6">
          <span className="block h-5 w-48 rounded bg-slate-100" />
          <span className="mt-6 block h-56 w-full rounded-xl bg-slate-100" />
        </div>
      </section>
    );
  }
  const submitRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const requestedAmount = Number(amount);
    if (!requestedAmount || requestedAmount < 10000)
      return toast.error('Loan amount must be at least $10,000.');
    if (requestedAmount > 300000) return toast.error('Maximum loan request is $300,000.');
    if (!purpose.trim()) return toast.error('Please provide the purpose of your loan.');
    try {
      await createLoan.mutateAsync({
        amount: requestedAmount,
        purpose: purpose.trim(),
        tenure: Number(tenure),
      });
      setAmount('');
      setPurpose('');
      setTenure('12');
      setRequestOpen(false);
      toast.success('Loan request submitted. HR will review it shortly.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Loan request could not be submitted.');
    }
  };

  return (
    <section className="w-full space-y-6 pb-8">
      <EmployeeHeader
        title="Employee loans"
        description="Request a loan, follow its approval, and keep track of your repayments."
        action={
          <button
            onClick={() => setRequestOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
          >
            <Plus className="size-4" />
            Request a loan
          </button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-sky-100 bg-linear-to-br from-sky-600 to-cyan-500 p-5 text-white shadow-sm shadow-sky-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-sky-100">Outstanding balance</p>
            <HandCoins className="size-5 text-sky-100" />
          </div>
          <p className="mt-5 text-2xl font-bold">{currency.format(activeLoan?.outstanding ?? 0)}</p>
          <p className="mt-1 text-xs text-sky-100">From your active loan</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Monthly instalment</p>
            <ReceiptText className="size-5 text-sky-600" />
          </div>
          <p className="mt-5 text-2xl font-bold text-slate-800">
            {currency.format(activeLoan?.installment ?? 0)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Deducted from monthly salary</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Next payment</p>
            <CalendarDays className="size-5 text-amber-600" />
          </div>
          <p className="mt-5 text-xl font-bold text-slate-800">{nextDue}</p>
          <p className="mt-1 text-xs text-slate-500">Salary deduction date</p>
        </article>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-bold text-slate-800">Active loan repayment</h2>
              <p className="mt-1 text-sm text-slate-500">
                Your approved loan is repaid through salary instalments.
              </p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
              Active
            </span>
          </div>
          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-slate-800">
                {activeLoan?.paidInstallments ?? 0} of {activeLoan?.tenure ?? 0} instalments paid
              </span>
              <span className="font-bold text-sky-700">{Math.round(progress)}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-sky-600" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-4 flex justify-between text-sm">
              <span className="text-slate-500">Paid: {currency.format(paidAmount)}</span>
              <span className="font-semibold text-slate-800">
                Remaining: {currency.format(activeLoan?.outstanding ?? 0)}
              </span>
            </div>
          </div>
          <div className="mt-5 divide-y divide-slate-100 text-sm">
            <div className="flex justify-between py-3">
              <span className="text-slate-500">Original loan amount</span>
              <span className="font-semibold text-slate-800">
                {currency.format(activeLoan?.principal ?? 0)}
              </span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-slate-500">Monthly salary deduction</span>
              <span className="font-semibold text-rose-600">
                −{currency.format(activeLoan?.installment ?? 0)}
              </span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-slate-500">Next deduction</span>
              <span className="font-semibold text-slate-800">{nextDue}</span>
            </div>
          </div>
        </article>
        <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <span className="grid size-11 place-items-center rounded-xl bg-sky-100 text-sky-700">
            <CircleDollarSign className="size-5" />
          </span>
          <h2 className="mt-4 font-bold text-slate-800">Loan information</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <li>• Minimum request: $10,000</li>
            <li>• Maximum request: $300,000</li>
            <li>• Repayment period: 3–24 months</li>
            <li>• Approved instalments are automatically deducted from salary.</li>
          </ul>
          <button
            onClick={() => setRequestOpen(true)}
            className="mt-6 w-full rounded-xl border border-sky-200 px-4 py-3 text-sm font-semibold text-sky-700 hover:bg-sky-50"
          >
            Check loan eligibility
          </button>
        </aside>
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="font-bold text-slate-800">Loan request history</h2>
          <p className="mt-1 text-sm text-slate-500">
            Review your previous and current loan requests.
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {requestHistory.map((request) => (
            <div
              key={request.id}
              className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-slate-800">{currency.format(request.amount)}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {request.purpose} · {request.tenure} months · Requested {request.requestedOn}
                </p>
              </div>
              <span
                className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${request.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : request.status === 'Rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}
              >
                {request.status}
              </span>
            </div>
          ))}
        </div>
      </section>
      <LoanDialog
        open={requestOpen}
        onOpenChange={setRequestOpen}
        amount={amount}
        onAmountChange={setAmount}
        tenure={tenure}
        onTenureChange={setTenure}
        purpose={purpose}
        onPurposeChange={setPurpose}
        formattedMonthlyInstallment={currency.format(monthlyInstallment)}
        onSubmit={submitRequest}
      />
    </section>
  );
}
