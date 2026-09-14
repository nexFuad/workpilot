'use client';
import { Check, HandCoins, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Pagination } from '@/components/shared/Pagination';
import { useHrLoans } from '@/hooks/use-hr-loans';
const money = new Intl.NumberFormat('en-BD', {
  style: 'currency',
  currency: 'BDT',
  maximumFractionDigits: 0,
});
const badge: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
};
export default function LoansPage() {
  const api = useHrLoans();
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const items =
    api.requests.data?.requests.filter((x) => filter === 'all' || x.status === filter) ?? [];
  const visible = items.slice((page - 1) * 10, page * 10);
  const review = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.review.mutateAsync({ id, status });
      toast.success(`Loan request ${status}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed.');
    }
  };
  return (
    <section className="w-full space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-600">
          HR workspace
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-800">Loans</h1>
        <p className="mt-2 text-sm text-slate-600">
          Review employee loan requests and manage repayment terms.
        </p>
      </div>
      <div className="flex flex-wrap justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <HandCoins className="size-5 text-emerald-600" />
          {items.length} request(s)
        </span>
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map((x) => (
            <button
              key={x}
              onClick={() => {
                setFilter(x);
                setPage(1);
              }}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${filter === x ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              {x}
            </button>
          ))}
        </div>
      </div>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-[70vh] overflow-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Employee</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Tenure</th>
                <th className="px-5 py-3">Monthly instalment</th>
                <th className="px-5 py-3">Purpose</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {api.requests.isLoading
                ? Array.from({ length: 10 }, (_, r) => (
                    <tr key={r} className="animate-pulse">
                      {Array.from({ length: 7 }, (_, c) => (
                        <td key={c} className="px-5 py-5">
                          <span className="block h-4 w-24 rounded bg-slate-100" />
                        </td>
                      ))}
                    </tr>
                  ))
                : visible.map((x) => (
                    <tr key={x.id}>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {x.user.fullName || x.user.employeeId}
                        </p>
                        <p className="text-xs text-slate-500">{x.user.employeeId}</p>
                      </td>
                      <td className="px-5 py-4 font-bold">{money.format(x.amount)}</td>
                      <td className="px-5 py-4">{x.tenure} months</td>
                      <td className="px-5 py-4 text-emerald-700">
                        {money.format(Math.ceil(x.amount / x.tenure))}
                      </td>
                      <td className="max-w-xs px-5 py-4 text-slate-600">{x.purpose}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${badge[x.status]}`}
                        >
                          {x.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {x.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => review(x.id, 'approved')}
                                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white"
                              >
                                <Check className="size-3.5" />
                                Accept
                              </button>
                              <button
                                onClick={() => review(x.id, 'rejected')}
                                className="flex items-center gap-1 rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700"
                              >
                                <X className="size-3.5" />
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400">Reviewed</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-5 py-4">
          <Pagination page={page} totalItems={items.length} pageSize={10} onPageChange={setPage} />
        </div>
      </section>
    </section>
  );
}
