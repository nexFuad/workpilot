'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BadgeDollarSign,
  CalendarDays,
  Eye,
  LoaderCircle,
  Mail,
  MapPin,
  MoreHorizontal,
  PencilLine,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserRound,
  UserX,
  UsersRound,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { Pagination } from '@/components/shared/Pagination';
import { SoftSelect } from '@/components/ui/SoftSelect';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { hrEmployeesServer } from '@/server/hr-employees.server';
import type { EmployeeRole, EmploymentType, HrEmployee } from '@/types/hr-employee.types';

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const employmentLabels: Record<EmploymentType, string> = {
  full_time: 'Full time',
  part_time: 'Part time',
  contract: 'Contract',
  intern: 'Intern',
};

function initials(employee: HrEmployee) {
  return (employee.fullName || employee.employeeId)
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function takeHome(employee: HrEmployee) {
  return (
    employee.basicSalary +
    employee.salaryAllowances +
    employee.salaryBonus -
    employee.salaryTax -
    employee.salaryProvidentFund
  );
}

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value))
    : 'Not provided';
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 wrap-break-word text-sm font-semibold text-slate-700">
        {value || 'Not provided'}
      </dd>
    </div>
  );
}

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | EmployeeRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [deleteTarget, setDeleteTarget] = useState<HrEmployee | null>(null);
  const [viewTarget, setViewTarget] = useState<HrEmployee | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search.trim());
  const params = {
    search: debouncedSearch,
    role: roleFilter,
    status: statusFilter,
    page,
    limit: 10,
  };
  const employeesQuery = useQuery({
    queryKey: ['hr', 'employees', params],
    queryFn: () => hrEmployeesServer.list(params),
  });
  const refreshEmployees = () => queryClient.invalidateQueries({ queryKey: ['hr'] });
  const setStatus = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      hrEmployeesServer.setStatus(id, isActive),
    onSuccess: refreshEmployees,
  });
  const removeEmployee = useMutation({
    mutationFn: hrEmployeesServer.remove,
    onSuccess: refreshEmployees,
  });
  const api = { employees: employeesQuery, setStatus, remove: removeEmployee };

  const employees = api.employees.data?.employees ?? [];
  const summary = api.employees.data?.summary;
  const pagination = api.employees.data?.pagination;
  const currentPage = pagination?.page ?? page;

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await api.remove.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      toast.success('Employee and related records deleted.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Employee could not be deleted.');
    }
  };

  const toggleStatus = async (employee: HrEmployee) => {
    try {
      await api.setStatus.mutateAsync({ id: employee.id, isActive: !employee.isActive });
      setOpenMenuId(null);
      toast.success(
        employee.isActive ? 'User suspended successfully.' : 'User activated successfully.',
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Account status could not be updated.');
    }
  };

  return (
    <section className="w-full space-y-6 pb-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
            HR workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-800">Employees</h1>
          <p className="mt-2 text-sm text-slate-600">
            Manage employee profiles, access, workplace and salary information.
          </p>
        </div>
        <Link
          href="/hr/employees/create"
          className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 sm:self-auto"
        >
          <Plus className="size-4" /> Create employee
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Team members', value: summary?.total ?? 0, icon: UsersRound },
          {
            label: 'Active accounts',
            value: summary?.active ?? 0,
            icon: ShieldCheck,
          },
          {
            label: 'Employees',
            value: summary?.employees ?? 0,
            icon: UserRound,
          },
          {
            label: 'HR members',
            value: summary?.hr ?? 0,
            icon: UserCheck,
          },
          {
            label: 'Monthly basic payroll',
            value: money.format(summary?.monthlyBasicPayroll ?? 0),
            icon: BadgeDollarSign,
          },
        ].map(({ label, value, icon: Icon }) => (
          <article
            key={label}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              {api.employees.isLoading ? (
                <span className="block h-7 w-24 animate-pulse rounded bg-slate-100" />
              ) : (
                <p className="truncate text-2xl font-bold text-slate-800">{value}</p>
              )}
              <p className="text-xs font-medium text-slate-500">{label}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <label className="relative block w-full xl:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search employee, department or email..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-emerald-400 focus:bg-white"
          />
        </label>
        <div className="-mt-2 grid w-full gap-2 sm:grid-cols-2 xl:w-95">
          <SoftSelect
            value={roleFilter}
            onValueChange={(value) => {
              setRoleFilter(value as 'all' | EmployeeRole);
              setPage(1);
            }}
            placeholder="Select role"
            tone="emerald"
            options={[
              { value: 'all', label: 'All roles' },
              { value: 'employee', label: 'Employee' },
              { value: 'hr', label: 'HR' },
            ]}
          />
          <SoftSelect
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as 'all' | 'active' | 'inactive');
              setPage(1);
            }}
            placeholder="Select status"
            tone="emerald"
            options={[
              { value: 'all', label: 'All status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Suspended' },
            ]}
          />
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-[70vh] overflow-auto">
          <table className="w-full min-w-287.5 text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Employee</th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">Employment</th>
                <th className="px-5 py-3">Site / Shift</th>
                <th className="px-5 py-3">Salary</th>
                <th className="px-5 py-3">Role / Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {api.employees.isLoading ? (
                Array.from({ length: 10 }, (_, row) => (
                  <tr key={row} className="animate-pulse">
                    {Array.from({ length: 7 }, (_, cell) => (
                      <td key={cell} className="px-5 py-5">
                        <span className="block h-4 w-24 rounded bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : employees.length ? (
                employees.map((employee) => (
                  <tr key={employee.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-xs font-bold text-emerald-700">
                          {initials(employee)}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-800">
                            {employee.fullName || employee.employeeId}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">{employee.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">
                      <p className="flex items-center gap-1.5">
                        <Mail className="size-3.5 text-slate-400" /> {employee.email || 'No email'}
                      </p>
                      <p className="mt-1.5 flex items-center gap-1.5">
                        <Phone className="size-3.5 text-slate-400" /> {employee.phone || 'No phone'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-700">
                        {employee.designation || 'Not assigned'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {employee.department || 'No department'} ·{' '}
                        {employmentLabels[employee.employmentType ?? 'full_time']}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">
                      <p className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-slate-400" />
                        {employee.defaultSite?.name || 'No site'}
                      </p>
                      <p className="mt-1.5 flex items-center gap-1.5">
                        <CalendarDays className="size-3.5 text-slate-400" />
                        {employee.defaultShift?.name || 'No shift'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800">
                        {money.format(employee.basicSalary)}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-emerald-700">
                        Net {money.format(takeHome(employee))}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold uppercase text-violet-700">
                        {employee.role}
                      </span>
                      <span
                        className={`mt-2 block w-fit rounded-full px-2.5 py-1 text-xs font-bold ${employee.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                      >
                        {employee.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="relative flex justify-end">
                        <button
                          type="button"
                          aria-label={`Open actions for ${employee.fullName || employee.employeeId}`}
                          aria-expanded={openMenuId === employee.id}
                          onClick={() =>
                            setOpenMenuId((current) =>
                              current === employee.id ? null : employee.id,
                            )
                          }
                          className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          <MoreHorizontal className="size-5" />
                        </button>
                        {openMenuId === employee.id && (
                          <>
                            <button
                              type="button"
                              aria-label="Close employee menu"
                              onClick={() => setOpenMenuId(null)}
                              className="fixed inset-0 z-20 cursor-default"
                            />
                            <div className="absolute right-0 top-11 z-30 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 text-left shadow-xl shadow-slate-200/70">
                              <button
                                type="button"
                                onClick={() => {
                                  setViewTarget(employee);
                                  setOpenMenuId(null);
                                }}
                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                              >
                                <Eye className="size-4" /> View user
                              </button>
                              <Link
                                href={`/hr/employees/${employee.id}`}
                                onClick={() => setOpenMenuId(null)}
                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                              >
                                <PencilLine className="size-4" /> Edit user
                              </Link>
                              <button
                                type="button"
                                disabled={api.setStatus.isPending}
                                onClick={() => void toggleStatus(employee)}
                                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${employee.isActive ? 'text-amber-700 hover:bg-amber-50' : 'text-emerald-700 hover:bg-emerald-50'}`}
                              >
                                {employee.isActive ? (
                                  <UserX className="size-4" />
                                ) : (
                                  <UserCheck className="size-4" />
                                )}
                                {employee.isActive ? 'Suspend user' : 'Activate user'}
                              </button>
                              <div className="my-1 border-t border-slate-100" />
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteTarget(employee);
                                  setOpenMenuId(null);
                                }}
                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Trash2 className="size-4" /> Delete user
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-sm text-slate-500">
                    {api.employees.isError
                      ? 'Employee records could not be loaded.'
                      : 'No employees found for this filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-5 py-4">
          <Pagination
            page={currentPage}
            totalItems={pagination?.total ?? 0}
            pageSize={10}
            onPageChange={setPage}
          />
        </div>
      </section>

      <Dialog.Root open={Boolean(viewTarget)} onOpenChange={(open) => !open && setViewTarget(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[2px]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
            {viewTarget && (
              <>
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="flex min-w-0 items-center gap-4">
                    <span
                      style={
                        viewTarget.profileImage
                          ? { backgroundImage: `url(${viewTarget.profileImage})` }
                          : undefined
                      }
                      className="grid size-16 shrink-0 place-items-center rounded-2xl bg-emerald-100 bg-cover bg-center text-lg font-bold text-emerald-700"
                    >
                      {!viewTarget.profileImage && initials(viewTarget)}
                    </span>
                    <div className="min-w-0">
                      <Dialog.Title className="truncate text-2xl font-bold text-slate-800">
                        {viewTarget.fullName || viewTarget.employeeId}
                      </Dialog.Title>
                      <Dialog.Description className="mt-1 text-sm text-slate-500">
                        {viewTarget.employeeId} · {viewTarget.designation || 'No designation'}
                      </Dialog.Description>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold uppercase text-violet-700">
                          {viewTarget.role}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${viewTarget.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                        >
                          {viewTarget.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Dialog.Close className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200">
                    <X className="size-4" />
                  </Dialog.Close>
                </div>

                <div className="mt-6 space-y-6">
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-700">
                      Basic information
                    </h3>
                    <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <DetailItem label="Email" value={viewTarget.email} />
                      <DetailItem label="Phone" value={viewTarget.phone} />
                      <DetailItem label="Gender" value={viewTarget.gender?.replaceAll('_', ' ')} />
                      <div className="sm:col-span-2 lg:col-span-3">
                        <DetailItem label="Address" value={viewTarget.address} />
                      </div>
                    </dl>
                  </section>
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-700">
                      Employment information
                    </h3>
                    <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <DetailItem label="Department" value={viewTarget.department} />
                      <DetailItem label="Designation" value={viewTarget.designation} />
                      <DetailItem
                        label="Employment type"
                        value={
                          viewTarget.employmentType
                            ? employmentLabels[viewTarget.employmentType]
                            : null
                        }
                      />
                      <DetailItem
                        label="Employment status"
                        value={viewTarget.employmentStatus.replaceAll('_', ' ')}
                      />
                      <DetailItem label="Joining date" value={formatDate(viewTarget.joiningDate)} />
                      <DetailItem label="Site" value={viewTarget.defaultSite?.name} />
                      <DetailItem
                        label="Shift"
                        value={
                          viewTarget.defaultShift
                            ? `${viewTarget.defaultShift.name} (${viewTarget.defaultShift.startTime}–${viewTarget.defaultShift.endTime})`
                            : null
                        }
                      />
                      <DetailItem
                        label="Account created"
                        value={formatDate(viewTarget.createdAt)}
                      />
                      <DetailItem label="Last updated" value={formatDate(viewTarget.updatedAt)} />
                    </dl>
                  </section>
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-700">
                      Salary information
                    </h3>
                    <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <DetailItem
                        label="Basic salary"
                        value={money.format(viewTarget.basicSalary)}
                      />
                      <DetailItem
                        label="Allowances"
                        value={money.format(viewTarget.salaryAllowances)}
                      />
                      <DetailItem label="Bonus" value={money.format(viewTarget.salaryBonus)} />
                      <DetailItem label="Tax" value={money.format(viewTarget.salaryTax)} />
                      <DetailItem
                        label="Provident fund"
                        value={money.format(viewTarget.salaryProvidentFund)}
                      />
                      <DetailItem label="Net salary" value={money.format(takeHome(viewTarget))} />
                      <DetailItem label="Salary type" value={viewTarget.salaryType} />
                    </dl>
                  </section>
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-700">
                      Emergency contact
                    </h3>
                    <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                      <DetailItem label="Contact name" value={viewTarget.emergencyContactName} />
                      <DetailItem label="Contact phone" value={viewTarget.emergencyContactPhone} />
                      <div className="sm:col-span-2">
                        <DetailItem
                          label="Contact address"
                          value={viewTarget.emergencyContactAddress}
                        />
                      </div>
                    </dl>
                  </section>
                </div>
                <div className="mt-7 flex justify-end border-t border-slate-100 pt-5">
                  <Link
                    href={`/hr/employees/${viewTarget.id}`}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700"
                  >
                    <PencilLine className="size-4" /> Edit user
                  </Link>
                </div>
              </>
            )}
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
              Permanently delete employee?
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-6 text-slate-500">
              “{deleteTarget?.fullName || deleteTarget?.employeeId}” and all related records will be
              permanently deleted.
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
                Delete employee
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
