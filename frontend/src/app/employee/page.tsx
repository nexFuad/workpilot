'use client';
import { useQuery } from '@tanstack/react-query';
import {
  BellRing,
  CalendarCheck,
  FileText,
  FolderKanban,
  ListTodo,
  WalletCards,
} from 'lucide-react';
import Link from 'next/link';
import { EmployeeHeader } from '@/components/employee/EmployeeHeader';
import { dashboardServer } from '@/server/dashboard.server';

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export default function EmployeePage() {
  const dashboard = useQuery({
    queryKey: ['dashboard', 'employee'],
    queryFn: dashboardServer.employee,
    refetchInterval: 60000,
  });
  const data = dashboard.data;
  const cards = [
    {
      label: 'Attendance',
      value: data?.attendance ? 'Checked in' : 'Not checked in',
      note: data?.attendance?.site ?? 'Record today’s attendance',
      icon: CalendarCheck,
      href: '/employee/attendance',
    },
    {
      label: 'Expected salary',
      value: data?.salary ? money.format(data.salary.netSalary) : 'Not available',
      note: data?.salary?.month ?? 'No payroll record',
      icon: WalletCards,
      href: '/employee/salary',
    },
    {
      label: 'Open tasks',
      value: String(data?.openTasks ?? 0),
      note: `${data?.pendingLeaves ?? 0} pending leave request(s)`,
      icon: ListTodo,
      href: '/employee/tasks',
    },
    {
      label: 'Active projects',
      value: String(data?.activeProjects ?? 0),
      note: `${data?.pendingDocuments ?? 0} document(s) awaiting review`,
      icon: FolderKanban,
      href: '/employee/projects',
    },
  ];
  return (
    <section className="w-full space-y-6 pb-8">
      <EmployeeHeader
        title="Employee dashboard"
        description="Your live work overview, updated from your WorkPilot records."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboard.isLoading
          ? Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <span className="block h-4 w-28 rounded bg-slate-100" />
                <span className="mt-7 block h-7 w-36 rounded bg-slate-100" />
                <span className="mt-3 block h-3 w-44 rounded bg-slate-100" />
              </div>
            ))
          : cards.map(({ label, value, note, icon: Icon, href }) => (
              <Link
                key={label}
                href={href}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">{label}</p>
                  <span className="grid size-9 place-items-center rounded-xl bg-sky-50 text-sky-600">
                    <Icon className="size-5" />
                  </span>
                </div>
                <p className="mt-5 text-2xl font-bold text-slate-800">{value}</p>
                <p className="mt-1 truncate text-xs text-slate-500">{note}</p>
              </Link>
            ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex justify-between border-b border-slate-100 p-5">
            <div>
              <h2 className="font-bold text-slate-800">Upcoming tasks</h2>
              <p className="mt-1 text-sm text-slate-500">Tasks that need your attention.</p>
            </div>
            <Link href="/employee/tasks" className="text-sm font-semibold text-sky-700">
              View all
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {dashboard.isLoading ? (
              Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="animate-pulse p-5">
                  <span className="block h-4 w-1/2 rounded bg-slate-100" />
                  <span className="mt-3 block h-3 w-1/3 rounded bg-slate-100" />
                </div>
              ))
            ) : data?.dueTasks.length ? (
              data.dueTasks.map((task) => (
                <Link
                  href="/employee/tasks"
                  key={task.id}
                  className="flex items-center justify-between gap-4 p-5 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{task.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Due{' '}
                      {task.dueDate
                        ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
                            new Date(task.dueDate),
                          )
                        : 'not set'}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                    {task.priority}
                  </span>
                </Link>
              ))
            ) : (
              <p className="p-8 text-center text-sm text-slate-500">No open tasks right now.</p>
            )}
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 p-5">
            <BellRing className="size-5 text-sky-600" />
            <div>
              <h2 className="font-bold text-slate-800">Latest announcements</h2>
              <p className="text-sm text-slate-500">From HR</p>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {dashboard.isLoading
              ? Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="animate-pulse p-5">
                    <span className="block h-4 w-1/2 rounded bg-slate-100" />
                    <span className="mt-3 block h-3 w-full rounded bg-slate-100" />
                  </div>
                ))
              : data?.announcements.map((item) => (
                  <Link
                    href="/employee/announcements"
                    key={item.id}
                    className="block p-5 hover:bg-slate-50"
                  >
                    <p className="font-semibold text-slate-800">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">{item.content}</p>
                  </Link>
                ))}
          </div>
        </section>
      </div>
      <section className="grid gap-4 sm:grid-cols-3">
        {dashboard.isLoading ? (
          Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <span className="block size-5 rounded bg-slate-100" />
              <span className="mt-4 block h-4 w-32 rounded bg-slate-100" />
              <span className="mt-3 block h-3 w-40 rounded bg-slate-100" />
            </div>
          ))
        ) : (
          <>
            <Link
              href="/employee/leave"
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <CalendarCheck className="size-5 text-sky-600" />
              <h2 className="mt-4 font-bold text-slate-800">Leave requests</h2>
              <p className="mt-1 text-sm text-slate-500">
                {data?.pendingLeaves ?? 0} pending request(s)
              </p>
            </Link>
            <Link
              href="/employee/documents"
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <FileText className="size-5 text-amber-600" />
              <h2 className="mt-4 font-bold text-slate-800">Documents</h2>
              <p className="mt-1 text-sm text-slate-500">
                {data?.pendingDocuments ?? 0} awaiting review
              </p>
            </Link>
            <Link
              href="/employee/loans"
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <WalletCards className="size-5 text-emerald-600" />
              <h2 className="mt-4 font-bold text-slate-800">Loan repayment</h2>
              <p className="mt-1 text-sm text-slate-500">
                Monthly: {money.format(data?.loanInstallment ?? 0)}
              </p>
            </Link>
          </>
        )}
      </section>
    </section>
  );
}
