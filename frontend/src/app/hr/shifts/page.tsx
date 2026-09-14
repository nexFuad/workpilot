'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { Clock3, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useShifts } from '@/hooks/use-hr-settings';
import type { Shift } from '@/server/hr-settings.server';
const empty = { name: '', startTime: '09:00', endTime: '17:00', isActive: true };
const twelveHour = (value: string) =>
  new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(
    new Date(`2000-01-01T${value}:00`),
  );
export default function ShiftsPage() {
  const api = useShifts();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Shift | null>(null);
  const [form, setForm] = useState(empty);
  const shifts = api.shifts.data?.shifts ?? [];
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
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) await api.update.mutateAsync({ id: editing.id, data: form });
      else await api.create.mutateAsync(form);
      setOpen(false);
      toast.success(`Shift ${editing ? 'updated' : 'created'}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save shift.');
    }
  };
  return (
    <section className="w-full space-y-6">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
            HR workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-800">Shifts</h1>
          <p className="mt-2 text-sm text-slate-600">Manage employee attendance schedules.</p>
        </div>
        <button
          onClick={() => start()}
          className="flex h-10 items-center gap-2 self-start rounded-lg bg-emerald-600 px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          <Plus className="size-4" />
          Create shift
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shifts.map((shift) => (
          <article
            key={shift.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50">
                  <Clock3 className="size-4 text-emerald-600" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate font-bold text-slate-800">{shift.name}</h2>
                  <p className="truncate text-sm text-slate-500">
                    {twelveHour(shift.startTime)} – {twelveHour(shift.endTime)}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-3 flex justify-end items-center gap-1 border-t border-slate-100 pt-3">
              <button
                aria-label="Toggle shift status"
                onClick={() =>
                  api.update.mutate({
                    id: shift.id,
                    data: {
                      name: shift.name,
                      startTime: shift.startTime,
                      endTime: shift.endTime,
                      isActive: !shift.isActive,
                    },
                  })
                }
                className={`relative h-5 w-10 rounded-full transition ${shift.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <span
                  className={`absolute top-1 size-3 rounded-full bg-white shadow transition ${shift.isActive ? 'left-5' : 'left-1'}`}
                />
              </button>
              <button
                onClick={() => start(shift)}
                className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50"
              >
                <Pencil className="size-4" />
              </button>
              <button
                onClick={async () => {
                  if (confirm(`Delete ${shift.name}?`))
                    try {
                      await api.remove.mutateAsync(shift.id);
                      toast.success('Shift deleted.');
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : 'Unable to delete shift.');
                    }
                }}
                className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </article>
        ))}
      </div>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/30" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex justify-between">
              <Dialog.Title className="text-xl font-bold">
                {editing ? 'Edit shift' : 'Create shift'}
              </Dialog.Title>
              <Dialog.Close>
                <X className="size-5" />
              </Dialog.Close>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Set the working schedule for attendance tracking.
            </p>
            <form onSubmit={save} className="mt-6 space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                Shift name
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Shift name"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-semibold text-slate-700">
                  Start time
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-emerald-400"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  End time
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-emerald-400"
                  />
                </label>
              </div>
              <label className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">
                Active shift
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className={`relative h-7 w-12 rounded-full ${form.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <span
                    className={`absolute top-1 size-5 rounded-full bg-white shadow ${form.isActive ? 'left-6' : 'left-1'}`}
                  />
                </button>
              </label>
              <button className="w-full rounded-xl bg-emerald-600 p-3 text-sm font-semibold text-white">
                Save shift
              </button>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
