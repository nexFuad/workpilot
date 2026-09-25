'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BellRing, Check, CheckCheck, LoaderCircle, MailOpen, Pin } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { EmployeeHeader } from '@/components/employee/EmployeeHeader';
import {
  AnnouncementDialog,
  formatDate,
  priorityStyles,
} from '@/components/employee/AnnouncementDialog';
import { SearchInput } from '@/components/shared/SearchInput';
import { useSearchBar } from '@/hooks/use-search-bar';
import { announcementsServer } from '@/server/announcements.server';
import type { Announcement } from '@/types/announcement.types';

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
  const queryClient = useQueryClient();
  const announcements = useSearchBar({
    queryKey: ['announcements'],
    queryFn: announcementsServer.list,
  });
  const markRead = useMutation({
    mutationFn: announcementsServer.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] }),
  });
  const api = { announcements, markRead };
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
            {api.announcements.isLoading ? (
              <span className="mt-4 block h-7 w-14 animate-pulse rounded bg-slate-100" />
            ) : (
              <p className="mt-4 text-2xl font-bold text-slate-800">{value}</p>
            )}
          </article>
        ))}
      </div>

      <div>
        <SearchInput
          wrapperClassName="relative block w-full sm:max-w-md"
          iconClassName="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-sky-600"
          value={api.announcements.searchTerm}
          onChange={(event) => api.announcements.setSearchTerm(event.target.value)}
          placeholder="Search announcement title, content or priority..."
          className="h-11 w-full rounded-xl border border-sky-100 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
        />
        {api.announcements.isFetching && !api.announcements.isLoading ? (
          <p className="mt-2 text-xs font-medium text-slate-500">Searching announcements…</p>
        ) : null}
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="font-bold text-slate-800">Company notices</h2>
            <p className="mt-1 text-sm text-slate-500">Published by HR.</p>
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
              {api.announcements.debouncedSearch
                ? 'No announcement matched your search.'
                : 'No announcements at the moment.'}
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

      <AnnouncementDialog selected={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
