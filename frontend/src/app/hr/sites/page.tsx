'use client';

import { DeleteModal } from '@/components/shared/DeleteModal';
import { HrHeader } from '@/components/hr/HrHeader';
import { HrSiteDialog } from '@/components/hr/HrSiteDialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Pagination } from '@/components/shared/Pagination';
import { SearchInput } from '@/components/shared/SearchInput';
import { useSearchBar } from '@/hooks/use-search-bar';
import { hrSettingsServer, type Site } from '@/server/hr-settings.server';

const empty = { name: '', location: '', isActive: true };
export default function SitesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Site | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Site | null>(null);
  const [form, setForm] = useState(empty);
  const sitesQuery = useSearchBar({
    queryKey: ['hr', 'sites', { page, limit: 10 }],
    queryFn: (search) => hrSettingsServer.sites({ page, limit: 10, search }),
  });
  const refreshSites = () => queryClient.invalidateQueries({ queryKey: ['hr', 'sites'] });
  const create = useMutation({
    mutationFn: (data: Omit<Site, 'id'>) => hrSettingsServer.createSite(data),
    onSuccess: refreshSites,
  });
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Omit<Site, 'id'> }) =>
      hrSettingsServer.updateSite(id, data),
    onSuccess: refreshSites,
  });
  const removeSite = useMutation({
    mutationFn: hrSettingsServer.deleteSite,
    onSuccess: refreshSites,
  });
  const api = { sites: sitesQuery, create, update, remove: removeSite };
  const sites = api.sites.data?.sites ?? [];
  const pagination = api.sites.data?.pagination;

  const start = (site?: Site) => {
    setEditing(site ?? null);
    setForm(site ? { name: site.name, location: site.location, isActive: site.isActive } : empty);
    setOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (editing) await api.update.mutateAsync({ id: editing.id, data: form });
      else await api.create.mutateAsync(form);
      setOpen(false);
      toast.success(`Site ${editing ? 'updated' : 'created'}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save site.');
    }
  };

  const toggleStatus = async (site: Site) => {
    try {
      await api.update.mutateAsync({
        id: site.id,
        data: { name: site.name, location: site.location, isActive: !site.isActive },
      });
      toast.success(`Site ${site.isActive ? 'deactivated' : 'activated'}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update site status.');
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await api.remove.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      toast.success('Site deleted.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete site.');
    }
  };

  const saving = api.create.isPending || api.update.isPending;

  return (
    <section className="w-full space-y-6 pb-8">
      <HrHeader
        title="Sites"
        description="Create and manage employee attendance locations."
        action={
          <button
            type="button"
            onClick={() => start()}
            className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 sm:self-auto"
          >
            <Plus className="size-4" /> Create site
          </button>
        }
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <SearchInput
          wrapperClassName="relative block w-full sm:max-w-md"
          iconClassName="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          value={api.sites.searchTerm}
          onChange={(event) => {
            api.sites.setSearchTerm(event.target.value);
            setPage(1);
          }}
          placeholder="Search site name or location..."
          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-[70vh] overflow-auto">
          <table className="w-full min-w-190 text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Site</th>
                <th className="px-5 py-3">Location / address</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {api.sites.isLoading ? (
                Array.from({ length: 10 }, (_, row) => (
                  <tr key={row} className="animate-pulse">
                    {Array.from({ length: 4 }, (_, cell) => (
                      <td key={cell} className="px-5 py-5">
                        <span className="block h-4 w-28 rounded bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : api.sites.isError ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center text-sm text-rose-600">
                    Sites could not be loaded.
                  </td>
                </tr>
              ) : sites.length ? (
                sites.map((site) => (
                  <tr key={site.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                          <MapPin className="size-4" />
                        </span>
                        <p className="font-bold text-slate-800">{site.name}</p>
                      </div>
                    </td>
                    <td className="max-w-lg px-5 py-4 text-sm text-slate-600">{site.location}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={site.isActive}
                          aria-label={`Toggle ${site.name} status`}
                          disabled={api.update.isPending}
                          onClick={() => void toggleStatus(site)}
                          className={`relative h-5 w-9 rounded-full transition disabled:opacity-50 ${site.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        >
                          <span
                            className={`absolute top-1 size-3 rounded-full bg-white transition ${site.isActive ? 'left-5' : 'left-1'}`}
                          />
                        </button>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${site.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                        >
                          {site.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => start(site)}
                          className="grid size-9 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                          aria-label={`Edit ${site.name}`}
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(site)}
                          className="grid size-9 place-items-center rounded-xl bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                          aria-label={`Delete ${site.name}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center text-sm text-slate-500">
                    {api.sites.debouncedSearch
                      ? 'No sites matched your search.'
                      : 'No sites have been created yet.'}
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

      <HrSiteDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        form={form}
        onFormChange={setForm}
        onSubmit={save}
        isSaving={saving}
      />

      <DeleteModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onDelete={() => void remove()}
        isDeleting={api.remove.isPending}
        title="Delete this site?"
        description={
          <>
            “{deleteTarget?.name}” will be permanently deleted if it is not used by attendance
            records.
          </>
        }
        confirmLabel="Delete site"
      />
    </section>
  );
}
