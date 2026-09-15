'use client';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, FileText, LoaderCircle, MoreHorizontal, Search, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Pagination } from '@/components/shared/Pagination';
import { useSearchBar } from '@/hooks/use-search-bar';
import { hrDocumentsServer, type HrDocument } from '@/server/hr-documents.server';
const colors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
};
export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [reviewTarget, setReviewTarget] = useState<{
    document: HrDocument;
    status: 'approved' | 'rejected';
  } | null>(null);
  const [reviewerNote, setReviewerNote] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<HrDocument | null>(null);
  const documents = useSearchBar({
    queryKey: ['hr', 'documents', { status: filter, page, limit: 10 }],
    queryFn: (search) => hrDocumentsServer.list({ status: filter, page, limit: 10, search }),
  });
  const reviewMutation = useMutation({
    mutationFn: ({
      id,
      status,
      note,
    }: {
      id: string;
      status: 'approved' | 'rejected';
      note: string;
    }) => hrDocumentsServer.review(id, status, note),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hr', 'documents'] }),
  });
  const removeMutation = useMutation({
    mutationFn: hrDocumentsServer.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hr', 'documents'] }),
  });
  const api = { documents, review: reviewMutation, remove: removeMutation };
  const items = api.documents.data?.documents ?? [];
  const pagination = api.documents.data?.pagination;
  const openReview = (document: HrDocument, status: 'approved' | 'rejected') => {
    setReviewTarget({ document, status });
    setReviewerNote('');
  };
  const review = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reviewTarget) return;
    if (!reviewerNote.trim()) return toast.error('Please write a reason for this decision.');
    try {
      await api.review.mutateAsync({
        id: reviewTarget.document.id,
        status: reviewTarget.status,
        note: reviewerNote.trim(),
      });
      toast.success(`Document ${reviewTarget.status}.`);
      setReviewTarget(null);
      setReviewerNote('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Review failed.');
    }
  };
  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await api.remove.mutateAsync(deleteTarget.id);
      toast.success('Document deleted successfully.');
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Document could not be deleted.');
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
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block w-full lg:max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={api.documents.searchTerm}
            onChange={(event) => {
              api.documents.setSearchTerm(event.target.value);
              setPage(1);
            }}
            placeholder="Search employee or document..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
          />
        </label>
        <div className="flex flex-wrap gap-2">
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
          <table className="w-full min-w-250 text-left text-sm">
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
                : items.map((x) => (
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
                        <div className="flex justify-end">
                          <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild>
                              <button
                                type="button"
                                aria-label={`Actions for ${x.name}`}
                                className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                              >
                                <MoreHorizontal className="size-4" />
                              </button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Portal>
                              <DropdownMenu.Content
                                align="end"
                                sideOffset={6}
                                className="z-50 min-w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
                              >
                                <DropdownMenu.Item
                                  onSelect={() => openReview(x, 'approved')}
                                  className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-emerald-700 outline-none hover:bg-emerald-50 focus:bg-emerald-50"
                                >
                                  <Check className="size-4" /> Approve
                                </DropdownMenu.Item>
                                <DropdownMenu.Item
                                  onSelect={() => openReview(x, 'rejected')}
                                  className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-amber-700 outline-none hover:bg-amber-50 focus:bg-amber-50"
                                >
                                  <X className="size-4" /> Reject
                                </DropdownMenu.Item>
                                <DropdownMenu.Separator className="my-1 h-px bg-slate-100" />
                                <DropdownMenu.Item
                                  onSelect={() => setDeleteTarget(x)}
                                  className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-rose-700 outline-none hover:bg-rose-50 focus:bg-rose-50"
                                >
                                  <Trash2 className="size-4" /> Delete
                                </DropdownMenu.Item>
                              </DropdownMenu.Content>
                            </DropdownMenu.Portal>
                          </DropdownMenu.Root>
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

      <Dialog.Root
        open={Boolean(reviewTarget)}
        onOpenChange={(open) => {
          if (!open && !api.review.isPending) setReviewTarget(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/70 bg-white p-6 shadow-2xl outline-none sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-xl font-bold text-slate-900">
                  {reviewTarget?.status === 'approved' ? 'Approve document' : 'Reject document'}
                </Dialog.Title>
                <Dialog.Description className="mt-1.5 text-sm leading-6 text-slate-500">
                  Add a reason for reviewing {reviewTarget?.document.name}.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  disabled={api.review.isPending}
                  aria-label="Close review dialog"
                  className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="size-5" />
                </button>
              </Dialog.Close>
            </div>
            <form onSubmit={review} className="mt-6 space-y-5">
              <label className="block text-sm font-bold text-slate-700">
                Review reason
                <textarea
                  value={reviewerNote}
                  onChange={(event) => setReviewerNote(event.target.value)}
                  rows={5}
                  required
                  placeholder="Write the reason for your decision"
                  className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-normal text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </label>
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    disabled={api.review.isPending}
                    className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={api.review.isPending}
                  className={`inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${reviewTarget?.status === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                >
                  {api.review.isPending ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : reviewTarget?.status === 'approved' ? (
                    <Check className="size-4" />
                  ) : (
                    <X className="size-4" />
                  )}
                  Confirm {reviewTarget?.status === 'approved' ? 'approval' : 'rejection'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !api.remove.isPending) setDeleteTarget(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/70 bg-white p-6 shadow-2xl outline-none sm:p-7">
            <span className="grid size-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
              <Trash2 className="size-5" />
            </span>
            <Dialog.Title className="mt-5 text-xl font-bold text-slate-900">
              Delete document?
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-6 text-slate-500">
              {deleteTarget?.name} will be permanently removed from the employee document records.
            </Dialog.Description>
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
              <Dialog.Close asChild>
                <button
                  type="button"
                  disabled={api.remove.isPending}
                  className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={remove}
                disabled={api.remove.isPending}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {api.remove.isPending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Delete document
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
