'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { BellRing, CalendarDays, Pin, X } from 'lucide-react';
import type { AnnouncementPriority, HrAnnouncement } from '@/types/hr-announcement.types';

export const priorityStyles: Record<AnnouncementPriority, string> = {
  normal: 'bg-sky-50 text-sky-700 ring-sky-100',
  important: 'bg-amber-50 text-amber-700 ring-amber-100',
  urgent: 'bg-rose-50 text-rose-700 ring-rose-100',
};

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function HrAnnouncementDetailsDialog({
  detailsTarget,
  onClose,
}: {
  detailsTarget: HrAnnouncement | null;
  onClose: () => void;
}) {
  return (
    <Dialog.Root open={Boolean(detailsTarget)} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              {detailsTarget?.isPinned ? (
                <Pin className="size-5 fill-current" />
              ) : (
                <BellRing className="size-6" />
              )}
            </span>
            <Dialog.Close className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800">
              <X className="size-4" />
            </Dialog.Close>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ring-1 ${priorityStyles[detailsTarget?.priority ?? 'normal']}`}
            >
              {detailsTarget?.priority}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${detailsTarget?.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
            >
              {detailsTarget?.isActive ? 'Active' : 'Inactive'}
            </span>
            {detailsTarget?.isPinned && (
              <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700">
                Pinned
              </span>
            )}
          </div>

          <Dialog.Title className="mt-4 text-2xl font-bold text-slate-800">
            {detailsTarget?.title}
          </Dialog.Title>
          <Dialog.Description asChild>
            <div>
              <p className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-400">
                <CalendarDays className="size-4" />
                Published {detailsTarget ? formatDate(detailsTarget.publishedAt) : ''}
              </p>
              <p className="mt-6 whitespace-pre-wrap border-t border-slate-100 pt-6 text-sm leading-7 text-slate-600">
                {detailsTarget?.content}
              </p>
            </div>
          </Dialog.Description>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
