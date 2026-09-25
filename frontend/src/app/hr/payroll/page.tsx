'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  CheckCircle2,
  LoaderCircle,
  Plus,
  RotateCcw,
  WalletCards,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { hrPayrollServer, type PayrollInput } from '@/server/hr-payroll.server';
import { HrHeader } from '@/components/hr/HrHeader';
import { HrPayrollDialog } from '@/components/hr/HrPayrollDialog';
import { Pagination } from '@/components/shared/Pagination';
import { SearchInput } from '@/components/shared/SearchInput';
import { useSearchBar } from '@/hooks/use-search-bar';
const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const empty = {
  userId: '',
  month: '',
  period: '',
  basic: 0,
  allowances: 0,
  bonus: 0,
  tax: 0,
  providentFund: 0,
  status: 'upcoming' as 'upcoming' | 'paid',
  paidOn: '',
};

function previousMonthValue() {
  const current = new Date();
  const previous = new Date(current.getFullYear(), current.getMonth() - 1, 1);
  return `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, '0')}`;
}

function payrollMonthLabel(value: string) {
  const [year, month] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export default function PayrollPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(previousMonthValue);
  const latestAllowedMonth = previousMonthValue();
  const month = payrollMonthLabel(selectedMonth);
  const data = useSearchBar({
    queryKey: ['hr', 'payroll', { status, month, page, limit: 10 }],
    queryFn: (search) => hrPayrollServer.list({ search, status, month, page, limit: 10 }),
  });
  const refreshPayroll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['hr', 'payroll'] }),
      queryClient.invalidateQueries({ queryKey: ['compensation'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ]);
  };
  const savePayroll = useMutation({
    mutationFn: (input: PayrollInput) => hrPayrollServer.save(input),
    onSuccess: refreshPayroll,
  });
  const generate = useMutation({
    mutationFn: hrPayrollServer.generate,
    onSuccess: refreshPayroll,
  });
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'upcoming' | 'paid' }) =>
      hrPayrollServer.updateStatus(id, status),
    onSuccess: refreshPayroll,
  });
  const api = { data, save: savePayroll, generate, updateStatus };
  const payments = api.data.data?.payments ?? [];
  const pagination = api.data.data?.pagination;
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.save.mutateAsync({ ...form, paidOn: form.paidOn || undefined });
      setOpen(false);
      toast.success('Payroll record saved.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save payroll.');
    }
  };
  const changeStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'paid' ? 'upcoming' : 'paid';
    try {
      await api.updateStatus.mutateAsync({ id, status: nextStatus });
      toast.success(nextStatus === 'paid' ? 'Salary marked as paid.' : 'Salary moved to upcoming.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Payroll status could not be updated.');
    }
  };
  return (
    <section className="w-full space-y-6">
      <HrHeader
        title="Payroll & salary"
        description="Generate and manage monthly salary records for every active employee and HR account."
        action={
          <button
            onClick={async () => {
              try {
                const result = await api.generate.mutateAsync();
                setSelectedMonth(previousMonthValue());
                setPage(1);
                toast.success(
                  `${result.generated} payroll record(s) generated for ${result.month}.`,
                );
              } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Payroll generation failed.');
              }
            }}
            disabled={api.generate.isPending}
            className="flex h-10 items-center gap-2 self-start rounded-lg bg-emerald-600 px-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {api.generate.isPending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            {api.generate.isPending ? 'Generating...' : 'Generate payroll'}
          </button>
        }
      />
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center">
        <SearchInput
          wrapperClassName="relative block w-full lg:max-w-sm"
          iconClassName="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          value={data.searchTerm}
          onChange={(event) => {
            data.setSearchTerm(event.target.value);
            setPage(1);
          }}
          placeholder="Search any employee or payroll information..."
          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-emerald-400 focus:bg-white"
        />
        <label className="flex h-10 w-fit items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-emerald-400 focus-within:bg-white">
          <span className="sr-only">Payroll month</span>
          <CalendarDays className="size-4 text-emerald-600" />
          <input
            type="month"
            value={selectedMonth}
            max={latestAllowedMonth}
            onChange={(event) => {
              const value = event.target.value;
              setSelectedMonth(value && value <= latestAllowedMonth ? value : latestAllowedMonth);
              setPage(1);
            }}
            className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
          />
        </label>
        <div className="flex flex-wrap gap-2 lg:ml-auto">
          {['all', 'upcoming', 'paid'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setStatus(item);
                setPage(1);
              }}
              className={`rounded-lg px-3 py-2 text-xs font-bold capitalize ${status === item ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              {item === 'all' ? 'All status' : item}
            </button>
          ))}
        </div>
      </div>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-[70vh] overflow-auto">
          <table className="w-full min-w-137.5 text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Employee</th>
                <th className="px-5 py-3">Month</th>
                <th className="px-5 py-3">Basic</th>
                <th className="px-5 py-3">Allowances</th>
                <th className="px-5 py-3">Deductions</th>
                <th className="px-5 py-3">Net salary</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {api.data.isLoading ? (
                Array.from({ length: 10 }, (_, row) => (
                  <tr key={row} className="animate-pulse">
                    {Array.from({ length: 8 }, (_, cell) => (
                      <td key={cell} className="px-5 py-5">
                        <span className="block h-4 w-24 rounded bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : api.data.isError ? (
                <tr>
                  <td colSpan={8} className="px-5 py-20 text-center">
                    <p className="font-bold text-rose-700">Payroll data could not be loaded.</p>
                    <button
                      type="button"
                      onClick={() => api.data.refetch()}
                      className="mt-2 text-sm font-semibold text-rose-600 underline underline-offset-4"
                    >
                      Try again
                    </button>
                  </td>
                </tr>
              ) : payments.length ? (
                payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">
                        {p.user.fullName || p.user.employeeId}
                      </p>
                      <p className="text-xs text-slate-500">{p.user.employeeId}</p>
                      <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        {p.user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">{p.month}</td>
                    <td className="px-5 py-4">{money.format(p.basic)}</td>
                    <td className="px-5 py-4">{money.format(p.allowances + p.bonus)}</td>
                    <td className="px-5 py-4 text-rose-600">
                      −{money.format(p.tax + p.providentFund)}
                    </td>
                    <td className="px-5 py-4 font-bold text-emerald-700">
                      {money.format(p.basic + p.allowances + p.bonus - p.tax - p.providentFund)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${p.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => void changeStatus(p.id, p.status)}
                        disabled={api.updateStatus.isPending}
                        className={`inline-flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${p.status === 'paid' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                      >
                        {api.updateStatus.isPending && api.updateStatus.variables?.id === p.id ? (
                          <LoaderCircle className="size-3.5 animate-spin" />
                        ) : p.status === 'paid' ? (
                          <RotateCcw className="size-3.5" />
                        ) : (
                          <CheckCircle2 className="size-3.5" />
                        )}
                        {p.status === 'paid' ? 'Set upcoming' : 'Mark paid'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-20 text-center">
                    <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                      <WalletCards className="size-5" />
                    </span>
                    <p className="mt-4 font-bold text-slate-800">No payroll data available</p>
                    <p className="mt-1 text-sm text-slate-500">
                      No payroll record was found for {month}
                      {data.debouncedSearch ? ' with the current search.' : '.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-5 py-4">
          <Pagination
            page={page}
            totalItems={pagination?.total ?? 0}
            pageSize={10}
            onPageChange={setPage}
          />
        </div>
      </section>
      <HrPayrollDialog
        open={open}
        onOpenChange={setOpen}
        form={form}
        onFormChange={setForm}
        employees={api.data.data?.employees}
        formatMoney={(value) => money.format(value)}
        onSubmit={save}
      />
    </section>
  );
}
