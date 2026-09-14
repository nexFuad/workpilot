'use client';

import * as Dialog from '@radix-ui/react-dialog';
import {
  BellRing,
  CalendarDays,
  Check,
  CheckCheck,
  LoaderCircle,
  MailOpen,
  Pin,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { EmployeeHeader } from '@/components/employee/EmployeeHeader';
import { useAnnouncements } from '@/hooks/use-announcements';
import type { Announcement } from '@/types/announcement.types';

const priorityStyles: Record<string, string> = {
  urgent: 'bg-rose-100 text-rose-700',
  important: 'bg-amber-100 text-amber-700',
  normal: 'bg-sky-100 text-sky-700',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function NotificationSkeleton() {
  return (
    <div className="animate-pulse p-5">
      <div className="flex gap-4">
        <span className="size-11 shrink-0 rounded-xl bg-slate-100" />
        <div className="flex-1">
          <div className="h-5 w-2/5 rounded bg-slate-100" />
          <div className="mt-3 h-4 w-full rounded bg-slate-100" />
          <div className="mt-2 h-4 w-3/4 rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

export default function AnnouncementsPage() {
  const api = useAnnouncements();
  const [selected, setSelected] = useState<Announcement | null>(null);
  const items = api.announcements.data?.announcements ?? [];
  const summary = api.announcements.data?.summary ?? { total: 0, unread: 0 };

  const markAsRead = async (item: Announcement) => {
    if (item.isRead) return;
    try {
      await api.markRead.mutateAsync(item.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not mark as read.');
    }
  };

  const openAnnouncement = (item: Announcement) => {
    setSelected(item);
    void markAsRead(item);
  };

  return (
    <section className="w-full space-y-6 pb-8">
      <EmployeeHeader
        title="Announcements"
        description="Stay updated with the latest company news and important notices."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'All announcements', value: summary.total, icon: BellRing },
          { label: 'Unread', value: summary.unread, icon: MailOpen },
          { label: 'Read', value: Math.max(summary.total - summary.unread, 0), icon: CheckCheck },
        ].map(({ label, value, icon: Icon }, index) => (
          <article
            key={label}
            className={`rounded-2xl border p-5 shadow-sm ${index === 1 && value > 0 ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white'}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-600">{label}</span>
              <Icon
                className={`size-5 ${index === 1 && value > 0 ? 'text-rose-600' : 'text-sky-600'}`}
              />
            </div>
            <p className="mt-4 text-2xl font-bold text-slate-800">{value}</p>
          </article>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="font-bold text-slate-800">Company notices</h2>
            <p className="mt-1 text-sm text-slate-500">Published by HR and administrators.</p>
          </div>
          {summary.unread > 0 && (
            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
              {summary.unread} new
            </span>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {api.announcements.isLoading ? (
            Array.from({ length: 5 }, (_, index) => <NotificationSkeleton key={index} />)
          ) : api.announcements.isError ? (
            <div className="p-10 text-center">
              <p className="text-sm font-semibold text-rose-600">
                Announcements could not be loaded.
              </p>
              <button
                type="button"
                onClick={() => api.announcements.refetch()}
                className="mt-3 text-sm font-bold text-sky-700 underline underline-offset-4"
              >
                Try again
              </button>
            </div>
          ) : items.length === 0 ? (
            <p className="p-10 text-center text-sm text-slate-500">
              No announcements at the moment.
            </p>
          ) : (
            items.map((item) => (
              <article
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => openAnnouncement(item)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') openAnnouncement(item);
                }}
                className={`relative cursor-pointer p-5 transition hover:bg-slate-50 ${item.isRead ? 'bg-white' : 'bg-sky-50/70'}`}
              >
                {!item.isRead && (
                  <span className="absolute left-2 top-1/2 size-2 -translate-y-1/2 rounded-full bg-sky-500" />
                )}
                <div className="flex items-start gap-3 sm:gap-4">
                  <span
                    className={`grid size-11 shrink-0 place-items-center rounded-xl ${item.isRead ? 'bg-slate-100 text-slate-500' : 'bg-sky-600 text-white'}`}
                  >
                    {item.isPinned ? (
                      <Pin className="size-4 fill-current" />
                    ) : (
                      <BellRing className="size-5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3
                          className={`font-bold ${item.isRead ? 'text-slate-700' : 'text-slate-900'}`}
                        >
                          {item.title}
                        </h3>
                        <p className="mt-1 text-xs font-medium text-slate-400">
                          {formatDate(item.publishedAt)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${priorityStyles[item.priority] ?? priorityStyles.normal}`}
                      >
                        {item.priority}
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                      {item.content}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void markAsRead(item);
                        }}
                        disabled={item.isRead || api.markRead.isPending}
                        className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition ${item.isRead ? 'cursor-default bg-emerald-50 text-emerald-700' : 'bg-rose-600 text-white hover:bg-rose-700'} disabled:opacity-70`}
                      >
                        {api.markRead.isPending && !item.isRead ? (
                          <LoaderCircle className="size-3.5 animate-spin" />
                        ) : (
                          <Check className="size-3.5" />
                        )}
                        {item.isRead ? 'Read' : 'Mark as read'}
                      </button>
                      <span className="text-xs font-bold text-sky-700">View details</span>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <Dialog.Root open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[2px]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sky-50 text-sky-600">
                {selected?.isPinned ? (
                  <Pin className="size-5 fill-current" />
                ) : (
                  <BellRing className="size-6" />
                )}
              </span>
              <Dialog.Close className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200">
                <X className="size-4" />
              </Dialog.Close>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${priorityStyles[selected?.priority ?? 'normal']}`}
              >
                {selected?.priority}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                <CheckCheck className="size-3.5" /> Read
              </span>
            </div>
            <Dialog.Title className="mt-4 text-2xl font-bold text-slate-800">
              {selected?.title}
            </Dialog.Title>
            <Dialog.Description asChild>
              <div>
                <p className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-400">
                  <CalendarDays className="size-4" />
                  Published {selected ? formatDate(selected.publishedAt) : ''}
                </p>
                <p className="mt-6 whitespace-pre-wrap border-t border-slate-100 pt-6 text-sm leading-7 text-slate-600">
                  {selected?.content}
                </p>
              </div>
            </Dialog.Description>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
