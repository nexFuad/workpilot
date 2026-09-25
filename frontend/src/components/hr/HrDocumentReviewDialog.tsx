'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Check, LoaderCircle, X } from 'lucide-react';
import type { FormEventHandler } from 'react';
import type { HrDocument } from '@/server/hr-documents.server';

type ReviewTarget = { document: HrDocument; status: 'approved' | 'rejected' };

type HrDocumentReviewDialogProps = {
  reviewTarget: ReviewTarget | null;
  reviewerNote: string;
  onReviewerNoteChange: (value: string) => void;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  isPending: boolean;
};

export function HrDocumentReviewDialog({
  reviewTarget,
  reviewerNote,
  onReviewerNoteChange,
  onClose,
  onSubmit,
  isPending,
}: HrDocumentReviewDialogProps) {
  return (
    <Dialog.Root
      open={Boolean(reviewTarget)}
      onOpenChange={(open) => {
        if (!open && !isPending) onClose();
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
                disabled={isPending}
                aria-label="Close review dialog"
                className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>
          <form onSubmit={onSubmit} className="mt-6 space-y-5">
            <label className="block text-sm font-bold text-slate-700">
              Review reason
              <textarea
                value={reviewerNote}
                onChange={(event) => onReviewerNoteChange(event.target.value)}
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
                  disabled={isPending}
                  className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={isPending}
                className={`inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${reviewTarget?.status === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
              >
                {isPending ? (
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
  );
}
