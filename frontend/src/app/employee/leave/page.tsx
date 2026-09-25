'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { EmployeeHeader } from '@/components/employee/EmployeeHeader';
import { LeaveRequestDialog } from '@/components/employee/LeaveRequestDialog';
import { DeleteModal } from '@/components/shared/DeleteModal';
import { SearchInput } from '@/components/shared/SearchInput';
import { useAuth } from '@/hooks/use-auth';
import { useSearchBar } from '@/hooks/use-search-bar';
import { leaveServer } from '@/server/leave.server';
import { leaveSchema } from '@/types/leave.types';
import type { LeaveRequest, LeaveRequestInput } from '@/types/leave.types';

const emptyForm: LeaveRequestInput = {
  leaveType: '',
  reason: '',
  startDate: '',
  endDate: '',
};
const formatDay = (date: string) =>
  new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(date));

export default function LeavePage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LeaveRequest | null>(null);
  const [deleting, setDeleting] = useState<LeaveRequest | null>(null);
  const [visibleCount, setVisibleCount] = useState(6);
  const { user } = useAuth();
  const requests = useSearchBar({
    queryKey: ['leave', 'requests'],
    queryFn: leaveServer.list,
  });
  const refreshRequests = () => queryClient.invalidateQueries({ queryKey: ['leave', 'requests'] });
  const create = useMutation({ mutationFn: leaveServer.create, onSuccess: refreshRequests });
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: LeaveRequestInput }) =>
      leaveServer.update(id, data),
    onSuccess: refreshRequests,
  });
  const remove = useMutation({ mutationFn: leaveServer.remove, onSuccess: refreshRequests });
  const {
    handleSubmit,
    reset,
    register,
    formState: { errors },
  } = useForm<LeaveRequestInput>({ resolver: zodResolver(leaveSchema), defaultValues: emptyForm });
  const openCreate = () => {
    setEditing(null);
    reset(emptyForm);
    setOpen(true);
  };
  const openEdit = (request: LeaveRequest) => {
    setEditing(request);
    reset({
      leaveType: request.leaveType,
      reason: request.reason,
      startDate: request.startDate.slice(0, 10),
      endDate: request.endDate.slice(0, 10),
    });
    setOpen(true);
  };
  const close = () => setOpen(false);
  const submit = async (data: LeaveRequestInput) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, data });
        toast.success('Leave request updated.');
      } else {
        await create.mutateAsync(data);
        toast.success('Leave request submitted.');
      }
      close();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save leave request.');
    }
  };
  const deleteRequest = async () => {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast.success('Leave request deleted.');
      setDeleting(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete leave request.');
    }
  };
  const busy = create.isPending || update.isPending;

  return (
    <section className="w-full">
      <EmployeeHeader
        title="Leave"
        description="Manage your leave balance and submitted requests."
        action={
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-100 px-4 py-3 text-sm font-semibold text-sky-700 hover:bg-sky-200"
          >
            <Plus className="size-4" />
            Leave request
          </button>
        }
      />
      <SearchInput
        wrapperClassName="relative mt-7 block max-w-md"
        iconClassName="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sky-600"
        value={requests.searchTerm}
        onChange={(event) => {
          requests.setSearchTerm(event.target.value);
          setVisibleCount(6);
        }}
        placeholder="Search any leave information"
        className="w-full rounded-xl border border-sky-100 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 outline-none focus:ring-4 focus:ring-sky-100"
      />
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {requests.isLoading &&
          Array.from({ length: 6 }, (_, index) => (
            <article
              key={index}
              className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex justify-between gap-4">
                <div className="w-full space-y-3">
                  <span className="block h-4 w-1/3 rounded bg-slate-100" />
                  <span className="block h-3 w-1/2 rounded bg-slate-100" />
                </div>
                <span className="h-6 w-20 rounded-full bg-slate-100" />
              </div>
              <span className="mt-5 block h-14 w-full rounded-xl bg-slate-100" />
              <span className="mt-4 block h-4 w-3/4 rounded bg-slate-100" />
            </article>
          ))}
        {requests.data?.requests.slice(0, visibleCount).map((request) => {
          const pending = request.status === 'pending';
          return (
            <article
              key={request.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-800">{request.leaveType}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Requested on {formatDay(request.createdAt)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${pending ? 'bg-amber-50 text-amber-700' : request.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}
                >
                  {request.status}
                </span>
              </div>
              <div className="mt-3 text-sm">
                <p className="rounded-lg bg-sky-50/70 px-3 py-2 text-slate-600">
                  <span className="block text-xs text-slate-500">Leave period</span>
                  <span className="mt-1 block font-medium text-slate-700">
                    {formatDay(request.startDate)} – {formatDay(request.endDate)}
                  </span>
                </p>
              </div>
              <div className="mt-3 flex items-start justify-between gap-3">
                <p className="min-w-0 text-sm leading-6 text-slate-600">
                  <span className="font-medium text-slate-700">Reason: </span>
                  {request.reason}
                </p>
                {pending && (
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => openEdit(request)}
                      aria-label="Edit leave request"
                      title="Edit request"
                      className="rounded-lg p-2 text-sky-700 hover:bg-sky-50"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => setDeleting(request)}
                      aria-label="Delete leave request"
                      title="Delete request"
                      className="rounded-lg p-2 text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                )}
              </div>
            </article>
          );
        })}
        {!requests.isLoading && requests.data?.requests.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 lg:col-span-2">
            <CalendarDays className="mx-auto size-7 text-sky-500" />
            <p className="mt-3">Leave requests will appear here.</p>
          </div>
        )}
      </div>
      {visibleCount < (requests.data?.requests.length ?? 0) && (
        <button
          onClick={() => setVisibleCount((count) => count + 6)}
          className="mt-5 rounded-xl border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-700"
        >
          Load more
        </button>
      )}

      <LeaveRequestDialog
        open={open}
        onOpenChange={setOpen}
        isEditing={Boolean(editing)}
        employeeId={user?.employeeId}
        handleSubmit={handleSubmit}
        onSubmit={submit}
        register={register}
        errors={errors}
        busy={busy}
      />
      <DeleteModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onDelete={() => void deleteRequest()}
        isDeleting={remove.isPending}
        title="Delete leave request?"
        description="This pending leave request will be permanently removed."
        confirmLabel="Delete"
      />
    </section>
  );
}
