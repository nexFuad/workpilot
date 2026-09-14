'use client';

import * as Dialog from '@radix-ui/react-dialog';
import {
  BellRing,
  CalendarDays,
  Check,
  Eye,
  LoaderCircle,
  Megaphone,
  PencilLine,
  Pin,
  Plus,
  Send,
  Sparkles,
  Trash2,
  UsersRound,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useHrAnnouncements } from '@/hooks/use-hr-announcements';
import type {
  AnnouncementPriority,
  HrAnnouncement,
  HrAnnouncementInput,
} from '@/types/hr-announcement.types';

const emptyForm: HrAnnouncementInput = {
  title: '',
  content: '',
  priority: 'normal',
  isPinned: false,
  isActive: true,
};

const priorityStyles: Record<AnnouncementPriority, string> = {
  normal: 'bg-sky-50 text-sky-700 ring-sky-100',
  important: 'bg-amber-50 text-amber-700 ring-amber-100',
  urgent: 'bg-rose-50 text-rose-700 ring-rose-100',
};

const fieldClass =
  'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100';

function announcementInput(item: HrAnnouncement): HrAnnouncementInput {
  return {
    title: item.title,
    content: item.content,
    priority: item.priority,
    isPinned: item.isPinned,
    isActive: item.isActive,
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
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
  const api = useHrAnnouncements();
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
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
            HR workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-800">Announcements</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Publish company updates and control what employees can see.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 sm:self-auto"
        >
          <Plus className="size-4" />
          Create announcement
        </button>
      </header>

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
              <p className="text-2xl font-bold text-slate-800">{value}</p>
              <p className="text-xs font-medium text-slate-500">{label}</p>
            </div>
          </article>
        ))}
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
              className="group h-[285px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
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
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
            <LoaderCircle className="size-4 animate-spin text-emerald-600" />
            Loading more announcements...
          </span>
        ) : items.length > 0 && !api.announcements.hasNextPage ? (
          <span className="text-xs font-semibold text-slate-400">All announcements loaded</span>
        ) : null}
      </div>

      <Dialog.Root open={editorOpen} onOpenChange={setEditorOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[2px]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-white/60 bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-2xl font-bold text-slate-800">
                  {editing ? 'Edit announcement' : 'Create announcement'}
                </Dialog.Title>
                <Dialog.Description className="mt-1.5 text-sm text-slate-500">
                  {editing
                    ? 'Update the announcement details and visibility.'
                    : 'Share an important update with all employees.'}
                </Dialog.Description>
              </div>
              <Dialog.Close className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800">
                <X className="size-4" />
              </Dialog.Close>
            </div>

            <form onSubmit={save} className="mt-6 space-y-5">
              <label className="block text-sm font-bold text-slate-700">
                Announcement title
                <input
                  required
                  minLength={3}
                  maxLength={160}
                  placeholder="e.g. Office holiday notice"
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  className={fieldClass}
                />
              </label>

              <label className="block text-sm font-bold text-slate-700">
                Announcement message
                <textarea
                  required
                  minLength={5}
                  maxLength={2000}
                  rows={6}
                  placeholder="Write the complete update for employees..."
                  value={form.content}
                  onChange={(event) => setForm({ ...form, content: event.target.value })}
                  className={`${fieldClass} resize-none leading-6`}
                />
                <span className="mt-1.5 block text-right text-xs font-medium text-slate-400">
                  {form.content.length}/2000
                </span>
              </label>

              <label className="block text-sm font-bold text-slate-700">
                Priority
                <select
                  value={form.priority}
                  onChange={(event) =>
                    setForm({ ...form, priority: event.target.value as AnnouncementPriority })
                  }
                  className={fieldClass}
                >
                  <option value="normal">Normal</option>
                  <option value="important">Important</option>
                  <option value="urgent">Urgent</option>
                </select>
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <span>
                    <span className="block text-sm font-bold text-slate-700">Active status</span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      Visible to employees
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
                    className="size-4 accent-emerald-600"
                  />
                </label>
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <span>
                    <span className="block text-sm font-bold text-slate-700">Pin announcement</span>
                    <span className="mt-0.5 block text-xs text-slate-500">Keep it at the top</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={form.isPinned}
                    onChange={(event) => setForm({ ...form, isPinned: event.target.checked })}
                    className="size-4 accent-emerald-600"
                  />
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : editing ? (
                    <Check className="size-4" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  {editing ? 'Save changes' : 'Publish announcement'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root
        open={Boolean(detailsTarget)}
        onOpenChange={(open) => !open && setDetailsTarget(null)}
      >
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

      <Dialog.Root
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[2px]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl">
            <span className="grid size-11 place-items-center rounded-xl bg-rose-50 text-rose-600">
              <Trash2 className="size-5" />
            </span>
            <Dialog.Title className="mt-4 text-xl font-bold text-slate-800">
              Delete announcement?
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-6 text-slate-500">
              “{deleteTarget?.title}” will be permanently removed and employees will no longer see
              it.
            </Dialog.Description>
            <div className="mt-6 flex justify-end gap-3">
              <Dialog.Close className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 hover:bg-slate-50">
                Cancel
              </Dialog.Close>
              <button
                type="button"
                disabled={api.remove.isPending}
                onClick={() => void remove()}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {api.remove.isPending && <LoaderCircle className="size-4 animate-spin" />}
                Delete
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
