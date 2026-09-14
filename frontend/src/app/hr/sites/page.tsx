'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { MapPin, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useSites } from '@/hooks/use-hr-settings';
import type { Site } from '@/server/hr-settings.server';
const empty = { name: '', location: '', isActive: true };
export default function SitesPage() {
  const api = useSites();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Site | null>(null);
  const [form, setForm] = useState(empty);
  const sites = api.sites.data?.sites ?? [];
  const start = (site?: Site) => {
    setEditing(site ?? null);
    setForm(site ? { name: site.name, location: site.location, isActive: site.isActive } : empty);
    setOpen(true);
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) await api.update.mutateAsync({ id: editing.id, data: form });
      else await api.create.mutateAsync(form);
      setOpen(false);
      toast.success(`Site ${editing ? 'updated' : 'created'}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save site.');
    }
  };
  return (
    <section className="w-full space-y-6">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
            HR workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-800">Sites</h1>
          <p className="mt-2 text-sm text-slate-600">Manage employee attendance locations.</p>
        </div>
        <button
          onClick={() => start()}
          className="flex h-10 items-center gap-2 self-start rounded-lg bg-emerald-600 px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          <Plus className="size-4" />
          Create site
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sites.map((site) => (
          <article
            key={site.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50">
                  <MapPin className="size-4 text-emerald-600" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate font-bold text-slate-800">{site.name}</h2>
                  <p className="truncate text-sm text-slate-500">{site.location}</p>
                </div>
              </div>
            </div>
            <div className="mt-3 flex justify-end items-center gap-1 border-t border-slate-100 pt-3">
              <button
                aria-label="Toggle site status"
                onClick={() =>
                  api.update.mutate({
                    id: site.id,
                    data: { name: site.name, location: site.location, isActive: !site.isActive },
                  })
                }
                className={`relative h-5 w-10 rounded-full transition ${site.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <span
                  className={`absolute top-1 size-3 rounded-full bg-white shadow transition ${site.isActive ? 'left-5' : 'left-1'}`}
                />
              </button>
              <button
                onClick={() => start(site)}
                className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50"
              >
                <Pencil className="size-4" />
              </button>
              <button
                onClick={async () => {
                  if (confirm(`Delete ${site.name}?`))
                    try {
                      await api.remove.mutateAsync(site.id);
                      toast.success('Site deleted.');
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : 'Unable to delete site.');
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
                {editing ? 'Edit site' : 'Create site'}
              </Dialog.Title>
              <Dialog.Close>
                <X className="size-5" />
              </Dialog.Close>
            </div>
            <p className="mt-1 text-sm text-slate-500">Add an attendance location for employees.</p>
            <form onSubmit={save} className="mt-6 space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                Site name
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Site name"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Location / address
                <input
                  required
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Location"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50"
                />
              </label>
              <label className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">
                Active site
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
                Save site
              </button>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
