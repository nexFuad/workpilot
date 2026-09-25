'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { PencilLine, X } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { EmploymentType, HrEmployee } from '@/types/hr-employee.types';

export const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export const employmentLabels: Record<EmploymentType, string> = {
  full_time: 'Full time',
  part_time: 'Part time',
  contract: 'Contract',
  intern: 'Intern',
};

export function initials(employee: HrEmployee) {
  return (employee.fullName || employee.employeeId)
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function takeHome(employee: HrEmployee) {
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

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 wrap-break-word text-sm font-semibold text-slate-700">
        {value || 'Not provided'}
      </dd>
    </div>
  );
}

export function HrEmployeeDialog({
  viewTarget,
  onClose,
}: {
  viewTarget: HrEmployee | null;
  onClose: () => void;
}) {
  return (
    <Dialog.Root open={Boolean(viewTarget)} onOpenChange={(open) => !open && onClose()}>
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
                    <DetailItem label="Account created" value={formatDate(viewTarget.createdAt)} />
                    <DetailItem label="Last updated" value={formatDate(viewTarget.updatedAt)} />
                  </dl>
                </section>
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-700">
                    Salary information
                  </h3>
                  <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <DetailItem label="Basic salary" value={money.format(viewTarget.basicSalary)} />
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
  );
}
