'use client';
import { Check, FileText, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Pagination } from '@/components/shared/Pagination';
import { useHrDocuments } from '@/hooks/use-hr-documents';
const colors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
};
export default function DocumentsPage() {
  const api = useHrDocuments();
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const items =
    api.documents.data?.documents.filter((x) => filter === 'all' || x.status === filter) ?? [];
  const visible = items.slice((page - 1) * 10, page * 10);
  const review = async (id: string, status: 'approved' | 'rejected') => {
    const reviewerNote = window.prompt('Reviewer note (optional):') ?? '';
    try {
      await api.review.mutateAsync({ id, status, note: reviewerNote });
      toast.success(`Document ${status}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Review failed.');
    }
  };
  return (
    <section className="w-full space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-600">
          HR workspace
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-800">Documents</h1>
        <p className="mt-2 text-sm text-slate-600">Review documents uploaded by all employees.</p>
      </div>
      <div className="flex flex-wrap justify-end gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-[70vh] overflow-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Employee</th>
                <th className="px-5 py-3">Document</th>
                <th className="px-5 py-3">Uploaded</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {api.documents.isLoading
                ? Array.from({ length: 10 }, (_, r) => (
                    <tr key={r} className="animate-pulse">
                      {Array.from({ length: 5 }, (_, c) => (
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
                      <td className="px-5 py-4">
                        <a
                          href={x.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 font-semibold text-emerald-700"
                        >
                          <FileText className="size-4" />
                          {x.name}
                        </a>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
                          new Date(x.createdAt),
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${colors[x.status]}`}
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
                            <span className="text-xs text-slate-400">Reviewed</span>
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
