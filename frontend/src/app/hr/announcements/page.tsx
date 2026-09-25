'use client';

import { DeleteModal } from '@/components/shared/DeleteModal';
import { HrHeader } from '@/components/hr/HrHeader';
import { HrAnnouncementEditorDialog } from '@/components/hr/HrAnnouncementEditorDialog';
import {
  HrAnnouncementDetailsDialog,
  priorityStyles,
  formatDate,
} from '@/components/hr/HrAnnouncementDetailsDialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BellRing,
  CalendarDays,
  Eye,
  Megaphone,
  PencilLine,
  Pin,
  Plus,
  Sparkles,
  Trash2,
  UsersRound,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { SearchInput } from '@/components/shared/SearchInput';
import { useInfiniteSearchBar } from '@/hooks/use-search-bar';
import { hrAnnouncementsServer } from '@/server/hr-announcements.server';
import type { HrAnnouncement, HrAnnouncementInput } from '@/types/hr-announcement.types';

const emptyForm: HrAnnouncementInput = {
  title: '',
  content: '',
  priority: 'normal',
  isPinned: false,
  isActive: true,
};

function announcementInput(item: HrAnnouncement): HrAnnouncementInput {
  return {
    title: item.title,
    content: item.content,
    priority: item.priority,
    isPinned: item.isPinned,
    isActive: item.isActive,
  };
}

function Toggle({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span className="relative h-5 w-9 rounded-full bg-slate-200 transition peer-checked:bg-emerald-500 peer-disabled:cursor-not-allowed peer-disabled:opacity-60 after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-4" />
      {label}
    </label>
  );
}

function AnnouncementSkeleton() {
  return (
    <article className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="h-1 bg-slate-100" />
      <div className="p-5">
        <div className="flex justify-between gap-4">
          <div className="h-5 w-20 rounded-full bg-slate-100" />
          <div className="h-5 w-16 rounded-full bg-slate-100" />
        </div>
        <div className="mt-5 h-6 w-2/3 rounded bg-slate-100" />
        <div className="mt-3 h-4 w-full rounded bg-slate-100" />
        <div className="mt-2 h-4 w-4/5 rounded bg-slate-100" />
        <div className="mt-6 flex justify-between border-t border-slate-100 pt-4">
          <div className="h-5 w-28 rounded bg-slate-100" />
          <div className="h-8 w-24 rounded-lg bg-slate-100" />
        </div>
      </div>
    </article>
  );
}

export default function AnnouncementsPage() {
  const queryClient = useQueryClient();
  const announcements = useInfiniteSearchBar({
    queryKey: ['hr', 'announcements'],
    queryFn: (search, pageParam) => hrAnnouncementsServer.list(pageParam, 6, search),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
  });
  const refreshAnnouncements = () =>
    queryClient.invalidateQueries({ queryKey: ['hr', 'announcements'] });
  const create = useMutation({
    mutationFn: hrAnnouncementsServer.create,
    onSuccess: refreshAnnouncements,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: HrAnnouncementInput }) =>
      hrAnnouncementsServer.update(id, input),
    onSuccess: refreshAnnouncements,
  });
  const removeAnnouncement = useMutation({
    mutationFn: hrAnnouncementsServer.remove,
    onSuccess: refreshAnnouncements,
  });
  const api = { announcements, create, update, remove: removeAnnouncement };
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<HrAnnouncement | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<HrAnnouncement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HrAnnouncement | null>(null);
  const [form, setForm] = useState<HrAnnouncementInput>(emptyForm);

  const pages = api.announcements.data?.pages ?? [];
  const items = pages.flatMap((page) => page.announcements);
  const total = pages[0]?.total ?? 0;
  const summary = pages[0]?.summary ?? { active: 0, pinned: 0 };
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = api.announcements;

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: '240px' },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setEditorOpen(true);
  };

  const openEdit = (item: HrAnnouncement) => {
    setEditing(item);
    setForm(announcementInput(item));
    setEditorOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (editing) {
        await api.update.mutateAsync({ id: editing.id, input: form });
        toast.success('Announcement updated.');
      } else {
        await api.create.mutateAsync(form);
        toast.success('Announcement published to employees.');
      }
      setEditorOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Announcement could not be saved.');
    }
  };

  const updateItem = async (item: HrAnnouncement, patch: Partial<HrAnnouncementInput>) => {
    try {
      await api.update.mutateAsync({
        id: item.id,
        input: { ...announcementInput(item), ...patch },
      });
      toast.success(
        patch.isPinned !== undefined
          ? patch.isPinned
            ? 'Announcement pinned.'
            : 'Announcement unpinned.'
          : patch.isActive
            ? 'Announcement is active.'
            : 'Announcement hidden from employees.',
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Status could not be changed.');
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await api.remove.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      toast.success('Announcement deleted.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Announcement could not be deleted.');
    }
  };

  const isSaving = api.create.isPending || api.update.isPending;

  return (
    <section className="w-full space-y-6 pb-10">
      <HrHeader
        title="Announcements"
        description="Publish company updates and control what employees can see."
        action={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 sm:self-auto"
          >
            <Plus className="size-4" />
            Create announcement
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total announcements', value: total, icon: Megaphone },
          {
            label: 'Active announcements',
            value: summary.active,
            icon: UsersRound,
          },
          {
            label: 'Pinned announcements',
            value: summary.pinned,
            icon: Pin,
          },
        ].map(({ label, value, icon: Icon }) => (
          <article
            key={label}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <Icon className="size-5" />
            </span>
            <div>
              {api.announcements.isPending ? (
                <span className="block h-7 w-14 animate-pulse rounded bg-slate-100" />
              ) : (
                <p className="text-2xl font-bold text-slate-800">{value}</p>
              )}
              <p className="text-xs font-medium text-slate-500">{label}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <SearchInput
          wrapperClassName="relative block w-full sm:max-w-md"
          iconClassName="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          value={announcements.searchTerm}
          onChange={(event) => announcements.setSearchTerm(event.target.value)}
          placeholder="Search announcement title or content..."
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
        />
      </div>

      {api.announcements.isPending ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }, (_, index) => (
            <AnnouncementSkeleton key={index} />
          ))}
        </div>
      ) : api.announcements.isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-10 text-center">
          <p className="font-semibold text-rose-700">Announcements could not be loaded.</p>
          <button
            type="button"
            onClick={() => api.announcements.refetch()}
            className="mt-3 text-sm font-bold text-rose-700 underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      ) : items.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <article
              key={item.id}
              className="group h-71.25 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div
                className={`h-1 ${item.priority === 'urgent' ? 'bg-rose-500' : item.priority === 'important' ? 'bg-amber-400' : 'bg-emerald-500'}`}
              />
              <div className="flex h-[calc(100%-0.25rem)] flex-col p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ${priorityStyles[item.priority]}`}
                  >
                    {item.priority}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold ${item.isActive ? 'text-emerald-700' : 'text-slate-400'}`}
                  >
                    <span
                      className={`size-2 rounded-full ${item.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    />
                    {item.isActive ? 'Visible to employees' : 'Inactive'}
                  </span>
                </div>

                <div className="mt-3 flex min-h-0 items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                    {item.isPinned ? (
                      <Pin className="size-4 fill-current" />
                    ) : (
                      <BellRing className="size-5" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-slate-800">{item.title}</h2>
                    <p className="mt-1.5 line-clamp-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {item.content}
                    </p>
                    <button
                      type="button"
                      onClick={() => setDetailsTarget(item)}
                      className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                    >
                      <Eye className="size-3.5" />
                      See more
                    </button>
                  </div>
                </div>

                <div className="mt-auto flex items-center gap-2 border-t border-slate-100 pt-3 text-xs font-medium text-slate-500">
                  <CalendarDays className="size-4 text-slate-400" />
                  Published {formatDate(item.publishedAt)}
                </div>

                <div className="mt-3 flex flex-col justify-between gap-3 rounded-xl bg-slate-50 p-2.5 sm:flex-row sm:items-center">
                  <div className="flex flex-wrap items-center gap-4">
                    <Toggle
                      checked={item.isActive}
                      disabled={api.update.isPending}
                      label="Active"
                      onChange={(checked) => void updateItem(item, { isActive: checked })}
                    />
                    <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600">
                      <input
                        type="checkbox"
                        checked={item.isPinned}
                        disabled={api.update.isPending}
                        onChange={(event) =>
                          void updateItem(item, { isPinned: event.target.checked })
                        }
                        className="size-4 rounded border-slate-300 accent-emerald-600"
                      />
                      Pin
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:border-emerald-200 hover:text-emerald-700"
                    >
                      <PencilLine className="size-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-rose-50 px-3 text-xs font-bold text-rose-600 transition hover:bg-rose-100"
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Sparkles className="size-6" />
          </span>
          <h2 className="mt-4 font-bold text-slate-800">No announcement yet</h2>
          <p className="mt-1 text-sm text-slate-500">Create your first company update.</p>
        </div>
      )}

      <div ref={loadMoreRef} className="flex min-h-10 items-center justify-center">
        {api.announcements.isFetchingNextPage ? (
          <span className="h-10 w-full max-w-md animate-pulse rounded-xl bg-slate-100" />
        ) : items.length > 0 && !api.announcements.hasNextPage ? (
          <span className="text-xs font-semibold text-slate-400">All announcements loaded</span>
        ) : null}
      </div>

      <HrAnnouncementEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editing={editing}
        form={form}
        onFormChange={setForm}
        onSubmit={save}
        isSaving={isSaving}
      />
      <HrAnnouncementDetailsDialog
        detailsTarget={detailsTarget}
        onClose={() => setDetailsTarget(null)}
      />

      <DeleteModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onDelete={() => void remove()}
        isDeleting={api.remove.isPending}
        title="Delete announcement?"
        description={
          <>
            “{deleteTarget?.title}” will be permanently removed and employees will no longer see it.
          </>
        }
        confirmLabel="Delete"
      />
    </section>
  );
}
