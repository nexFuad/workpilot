'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Pagination } from '@/components/shared/Pagination';
import { HrHeader } from '@/components/hr/HrHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { useSearchBar } from '@/hooks/use-search-bar';
import { hrLeaveServer } from '@/server/hr-leave.server';
const format = (value: string) =>
  new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value));
const badge: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
};
export default function LeavePage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const requests = useSearchBar({
    queryKey: ['hr', 'leaves', { status: filter, page, limit: 10 }],
    queryFn: (search) => hrLeaveServer.list({ status: filter, page, limit: 10, search }),
  });
  const reviewMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) =>
      hrLeaveServer.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hr', 'leaves'] }),
  });
  const api = { requests, review: reviewMutation };
  const items = api.requests.data?.requests ?? [];
  const pagination = api.requests.data?.pagination;
  const review = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.review.mutateAsync({ id, status });
      toast.success(`Leave request ${status}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update request.');
    }
  };
  return (
    <section className="w-full space-y-6">
      <HrHeader
        title="Leave requests"
        description="Review employee leave requests and update their approval status."
        badge={
          api.requests.isLoading ? (
            <span className="h-6 w-20 animate-pulse rounded-full bg-slate-200" />
          ) : (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
              {pagination?.total ?? 0} request(s)
            </span>
          )
        }
      />
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <SearchInput
            wrapperClassName="relative block w-full lg:max-w-md"
            iconClassName="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            value={api.requests.searchTerm}
            onChange={(event) => {
              api.requests.setSearchTerm(event.target.value);
              setPage(1);
            }}
            placeholder="Search name/type/reason or 2026-09 / September 2026..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
          />
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'approved', 'rejected'].map((item) => (
              <button
                key={item}
                onClick={() => {
                  setFilter(item);
                  setPage(1);
                }}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${filter === item ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="font-bold text-slate-800">Leave request register</h2>
          <p className="mt-1 text-sm text-slate-500">
            Approve or reject pending employee leave requests.
          </p>
        </div>
        <div className="h-[70vh] overflow-auto">
          <table className="w-full min-w-262.5 text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Employee</th>
                <th className="px-5 py-3">Leave type</th>
                <th className="px-5 py-3">Dates</th>
                <th className="px-5 py-3">Reason</th>
                <th className="px-5 py-3">Requested</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {api.requests.isLoading
                ? Array.from({ length: 10 }, (_, row) => (
                    <tr key={row} className="animate-pulse">
                      {Array.from({ length: 7 }, (_, cell) => (
                        <td key={cell} className="px-5 py-5">
                          <span className="block h-4 w-24 rounded bg-slate-100" />
                        </td>
                      ))}
                    </tr>
                  ))
                : items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {item.user.fullName || item.user.employeeId}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{item.user.employeeId}</p>
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-700">{item.leaveType}</td>
                      <td className="px-5 py-4 text-slate-600">
                        {format(item.startDate)}
                        <br />
                        <span className="text-xs">to {format(item.endDate)}</span>
                      </td>
                      <td className="max-w-xs px-5 py-4 text-slate-600">{item.reason}</td>
                      <td className="px-5 py-4 text-slate-600">{format(item.createdAt)}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${badge[item.status]}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {item.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => review(item.id, 'approved')}
                                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white"
                              >
                                <Check className="size-3.5" />
                                Accept
                              </button>
                              <button
                                onClick={() => review(item.id, 'rejected')}
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
          <Pagination
            page={pagination?.page ?? page}
            totalItems={pagination?.total ?? 0}
            pageSize={10}
            onPageChange={setPage}
          />
        </div>
      </section>
    </section>
  );
}
