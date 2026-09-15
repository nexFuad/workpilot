'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock3, LoaderCircle, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Pagination } from '@/components/shared/Pagination';
import { useSearchBar } from '@/hooks/use-search-bar';
import { hrSettingsServer, type Shift } from '@/server/hr-settings.server';

const empty = { name: '', startTime: '09:00', endTime: '17:00', isActive: true };
const fieldClass =
  'mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100';
const twelveHour = (value: string) =>
  new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(
    new Date(`2000-01-01T${value}:00`),
  );

export default function ShiftsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Shift | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Shift | null>(null);
  const [form, setForm] = useState(empty);
  const shiftsQuery = useSearchBar({
    queryKey: ['hr', 'shifts', { page, limit: 10 }],
    queryFn: (search) => hrSettingsServer.shifts({ page, limit: 10, search }),
  });
  const refreshShifts = () => queryClient.invalidateQueries({ queryKey: ['hr', 'shifts'] });
  const create = useMutation({
    mutationFn: (data: Omit<Shift, 'id'>) => hrSettingsServer.createShift(data),
    onSuccess: refreshShifts,
  });
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Omit<Shift, 'id'> }) =>
      hrSettingsServer.updateShift(id, data),
    onSuccess: refreshShifts,
  });
  const removeShift = useMutation({
    mutationFn: hrSettingsServer.deleteShift,
    onSuccess: refreshShifts,
  });
  const api = { shifts: shiftsQuery, create, update, remove: removeShift };
  const shifts = api.shifts.data?.shifts ?? [];
  const pagination = api.shifts.data?.pagination;

  const start = (shift?: Shift) => {
    setEditing(shift ?? null);
    setForm(
      shift
        ? {
            name: shift.name,
            startTime: shift.startTime,
            endTime: shift.endTime,
            isActive: shift.isActive,
          }
        : empty,
    );
    setOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (editing) await api.update.mutateAsync({ id: editing.id, data: form });
      else await api.create.mutateAsync(form);
      setOpen(false);
      toast.success(`Shift ${editing ? 'updated' : 'created'}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save shift.');
    }
  };

  const toggleStatus = async (shift: Shift) => {
    try {
      await api.update.mutateAsync({
        id: shift.id,
        data: {
          name: shift.name,
          startTime: shift.startTime,
          endTime: shift.endTime,
          isActive: !shift.isActive,
        },
      });
      toast.success(`Shift ${shift.isActive ? 'deactivated' : 'activated'}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update shift status.');
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await api.remove.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      toast.success('Shift deleted.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete shift.');
    }
  };

  const saving = api.create.isPending || api.update.isPending;

  return (
    <section className="w-full space-y-6 pb-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
            HR workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-800">Shifts</h1>
          <p className="mt-2 text-sm text-slate-600">
            Create and manage employee attendance schedules.
          </p>
        </div>
        <button
          type="button"
          onClick={() => start()}
          className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 sm:self-auto"
        >
          <Plus className="size-4" /> Create shift
        </button>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="relative block w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={api.shifts.searchTerm}
            onChange={(event) => {
              api.shifts.setSearchTerm(event.target.value);
              setPage(1);
            }}
            placeholder="Search shift name or time..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
          />
        </label>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-[70vh] overflow-auto">
          <table className="w-full min-w-205 text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Shift</th>
                <th className="px-5 py-3">Start time</th>
                <th className="px-5 py-3">End time</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {api.shifts.isLoading ? (
                Array.from({ length: 10 }, (_, row) => (
                  <tr key={row} className="animate-pulse">
                    {Array.from({ length: 5 }, (_, cell) => (
                      <td key={cell} className="px-5 py-5">
                        <span className="block h-4 w-24 rounded bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : api.shifts.isError ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-sm text-rose-600">
                    Shifts could not be loaded.
                  </td>
                </tr>
              ) : shifts.length ? (
                shifts.map((shift) => (
                  <tr key={shift.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                          <Clock3 className="size-4" />
                        </span>
                        <p className="font-bold text-slate-800">{shift.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-600">
                      {twelveHour(shift.startTime)}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-600">
                      {twelveHour(shift.endTime)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={shift.isActive}
                          aria-label={`Toggle ${shift.name} status`}
                          disabled={api.update.isPending}
                          onClick={() => void toggleStatus(shift)}
                          className={`relative h-5 w-9 rounded-full transition disabled:opacity-50 ${shift.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        >
                          <span
                            className={`absolute top-1 size-3 rounded-full bg-white transition ${shift.isActive ? 'left-5' : 'left-1'}`}
                          />
                        </button>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${shift.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                        >
                          {shift.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => start(shift)}
                          className="grid size-9 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                          aria-label={`Edit ${shift.name}`}
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(shift)}
                          className="grid size-9 place-items-center rounded-xl bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                          aria-label={`Delete ${shift.name}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-sm text-slate-500">
                    {api.shifts.debouncedSearch
                      ? 'No shifts matched your search.'
                      : 'No shifts have been created yet.'}
                  </td>
                </tr>
              )}
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

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-2xl font-bold text-slate-800">
                  {editing ? 'Edit shift' : 'Create shift'}
                </Dialog.Title>
                <Dialog.Description className="mt-1.5 text-sm text-slate-500">
                  Set the working schedule for attendance tracking.
                </Dialog.Description>
              </div>
              <Dialog.Close className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200">
                <X className="size-4" />
              </Dialog.Close>
            </div>
            <form onSubmit={save} className="mt-6 space-y-4">
              <label className="block text-sm font-bold text-slate-700">
                Shift name
                <input
                  required
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="Enter shift name"
                  className={fieldClass}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-bold text-slate-700">
                  Start time
                  <input
                    required
                    type="time"
                    value={form.startTime}
                    onChange={(event) => setForm({ ...form, startTime: event.target.value })}
                    className={fieldClass}
                  />
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  End time
                  <input
                    required
                    type="time"
                    value={form.endTime}
                    onChange={(event) => setForm({ ...form, endTime: event.target.value })}
                    className={fieldClass}
                  />
                </label>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3.5">
                <div>
                  <p className="text-sm font-bold text-slate-700">Active shift</p>
                  <p className="mt-0.5 text-xs text-slate-500">Available for attendance</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.isActive}
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className={`relative h-5 w-9 rounded-full ${form.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <span
                    className={`absolute top-1 size-3 rounded-full bg-white transition ${form.isActive ? 'left-5' : 'left-1'}`}
                  />
                </button>
              </div>
              <button
                disabled={saving}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving && <LoaderCircle className="size-4 animate-spin" />}
                {editing ? 'Save changes' : 'Create shift'}
              </button>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root
        open={Boolean(deleteTarget)}
        onOpenChange={(value) => !value && setDeleteTarget(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl">
            <span className="grid size-11 place-items-center rounded-xl bg-rose-50 text-rose-600">
              <Trash2 className="size-5" />
            </span>
            <Dialog.Title className="mt-4 text-xl font-bold text-slate-800">
              Delete this shift?
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-6 text-slate-500">
              “{deleteTarget?.name}” will be permanently deleted if it is not used by attendance
              records.
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
                Delete shift
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
