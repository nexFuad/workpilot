'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { Plus, WalletCards, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useHrPayroll } from '@/hooks/use-hr-payroll';
import { Pagination } from '@/components/shared/Pagination';
const money = new Intl.NumberFormat('en-BD', {
  style: 'currency',
  currency: 'BDT',
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
export default function PayrollPage() {
  const api = useHrPayroll();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [page, setPage] = useState(1);
  const payments = api.data.data?.payments ?? [];
  const visiblePayments = payments.slice((page - 1) * 10, page * 10);
  const total = (p: typeof empty) => p.basic + p.allowances + p.bonus - p.tax - p.providentFund;
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
  return (
    <section className="w-full space-y-6">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-600">
            HR workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-800">Payroll & salary</h1>
          <p className="mt-2 text-sm text-slate-600">
            Create and manage employee monthly salary records.
          </p>
        </div>
        <button
          onClick={async () => {
            try {
              const result = await api.generate.mutateAsync();
              toast.success(`${result.generated} payroll record(s) generated for ${result.month}.`);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : 'Payroll generation failed.');
            }
          }}
          className="flex h-10 items-center gap-2 self-start rounded-lg bg-emerald-600 px-3.5 text-sm font-semibold text-white"
        >
          <Plus className="size-4" />
          Generate payroll
        </button>
      </div>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-[70vh] overflow-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Employee</th>
                <th className="px-5 py-3">Month</th>
                <th className="px-5 py-3">Basic</th>
                <th className="px-5 py-3">Allowances</th>
                <th className="px-5 py-3">Deductions</th>
                <th className="px-5 py-3">Net salary</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {api.data.isLoading
                ? Array.from({ length: 10 }, (_, row) => (
                    <tr key={row} className="animate-pulse">
                      {Array.from({ length: 7 }, (_, cell) => (
                        <td key={cell} className="px-5 py-5">
                          <span className="block h-4 w-24 rounded bg-slate-100" />
                        </td>
                      ))}
                    </tr>
                  ))
                : visiblePayments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {p.user.fullName || p.user.employeeId}
                        </p>
                        <p className="text-xs text-slate-500">{p.user.employeeId}</p>
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
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-5 py-4">
          <Pagination
            page={page}
            totalItems={payments.length}
            pageSize={10}
            onPageChange={setPage}
          />
        </div>
      </section>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/30" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex justify-between">
              <Dialog.Title className="text-xl font-bold">Create payroll</Dialog.Title>
              <Dialog.Close>
                <X className="size-5" />
              </Dialog.Close>
            </div>
            <form onSubmit={save} className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                Employee
                <select
                  required
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border p-3"
                >
                  <option value="">Select employee</option>
                  {api.data.data?.employees.map((e) => (
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
                  onChange={(e) => setForm({ ...form, month: e.target.value })}
                  placeholder="September 2026"
                  className="mt-1.5 w-full rounded-xl border p-3"
                />
              </label>
              <label className="text-sm font-semibold sm:col-span-2">
                Payroll period
                <input
                  required
                  value={form.period}
                  onChange={(e) => setForm({ ...form, period: e.target.value })}
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
                    onChange={(e) => setForm({ ...form, [k]: Number(e.target.value) })}
                    className="mt-1.5 w-full rounded-xl border p-3"
                  />
                </label>
              ))}
              <label className="text-sm font-semibold">
                Payment status
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as 'paid' | 'upcoming' })
                  }
                  className="mt-1.5 w-full rounded-xl border p-3"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="paid">Paid</option>
                </select>
              </label>
              <div className="rounded-xl bg-emerald-50 p-4 sm:col-span-2">
                <p className="text-xs font-bold uppercase text-emerald-700">Estimated net salary</p>
                <p className="mt-1 text-xl font-bold text-emerald-800">
                  {money.format(total(form))}
                </p>
              </div>
              <button className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 p-3 text-sm font-semibold text-white sm:col-span-2">
                <WalletCards className="size-4" />
                Save payroll
              </button>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
