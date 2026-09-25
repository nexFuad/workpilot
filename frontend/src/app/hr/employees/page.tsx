'use client';

import { DeleteModal } from '@/components/shared/DeleteModal';
import { HrHeader } from '@/components/hr/HrHeader';
import {
  employmentLabels,
  HrEmployeeDialog,
  initials,
  money,
  takeHome,
} from '@/components/hr/HrEmployeeDialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BadgeDollarSign,
  CalendarDays,
  Eye,
  Mail,
  MapPin,
  MoreHorizontal,
  PencilLine,
  Phone,
  Plus,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserRound,
  UserX,
  UsersRound,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { Pagination } from '@/components/shared/Pagination';
import { SoftSelect } from '@/components/ui/SoftSelect';
import { SearchInput } from '@/components/shared/SearchInput';
import { useSearchBar } from '@/hooks/use-search-bar';
import { hrEmployeesServer } from '@/server/hr-employees.server';
import type { EmployeeRole, HrEmployee } from '@/types/hr-employee.types';

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<'all' | EmployeeRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [deleteTarget, setDeleteTarget] = useState<HrEmployee | null>(null);
  const [viewTarget, setViewTarget] = useState<HrEmployee | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const employeesQuery = useSearchBar({
    queryKey: ['hr', 'employees', { role: roleFilter, status: statusFilter, page, limit: 10 }],
    queryFn: (search) =>
      hrEmployeesServer.list({ search, role: roleFilter, status: statusFilter, page, limit: 10 }),
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
      <HrHeader
        title="Employees"
        description="Manage employee profiles, access, workplace and salary information."
        action={
          <Link
            href="/hr/employees/create"
            className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 sm:self-auto"
          >
            <Plus className="size-4" /> Create employee
          </Link>
        }
      />

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
        <SearchInput
          wrapperClassName="relative block w-full xl:max-w-sm"
          iconClassName="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          value={employeesQuery.searchTerm}
          onChange={(event) => {
            employeesQuery.setSearchTerm(event.target.value);
            setPage(1);
          }}
          placeholder="Search employee, department or email..."
          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-emerald-400 focus:bg-white"
        />
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

      <HrEmployeeDialog viewTarget={viewTarget} onClose={() => setViewTarget(null)} />

      <DeleteModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onDelete={() => void remove()}
        isDeleting={api.remove.isPending}
        title="Permanently delete employee?"
        description={
          <>
            “{deleteTarget?.fullName || deleteTarget?.employeeId}” and all related records will be
            permanently deleted.
          </>
        }
        confirmLabel="Delete employee"
      />
    </section>
  );
}
