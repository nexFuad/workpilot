'use client';
import { useQuery } from '@tanstack/react-query';

import {
  Activity,
  BellRing,
  CalendarCheck2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  FolderKanban,
  HandCoins,
  ListTodo,
  ReceiptText,
  RefreshCw,
  UserPlus,
  UsersRound,
  WalletCards,
} from 'lucide-react';
import Link from 'next/link';
import { dashboardServer } from '@/server/dashboard.server';

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function formatDate(value: string | null) {
  if (!value) return 'Not scheduled';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(value),
  );
}

function formatTime(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(value),
  );
}

function initials(name: string | null, employeeId: string) {
  return (name || employeeId)
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function DashboardSkeleton() {
  return (
    <section className="animate-pulse space-y-6" aria-label="Loading HR dashboard">
      <div className="h-56 rounded-3xl bg-emerald-100" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-36 rounded-2xl bg-white shadow-sm" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-36 rounded-2xl bg-white shadow-sm" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.75fr]">
        <div className="h-102.5 rounded-2xl bg-white shadow-sm" />
        <div className="h-102.5 rounded-2xl bg-white shadow-sm" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-96 rounded-2xl bg-white shadow-sm" />
        <div className="h-96 rounded-2xl bg-white shadow-sm" />
      </div>
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="grid min-h-36 place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}

function PanelHeader({ title, subtitle, href }: { title: string; subtitle: string; href: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
      <div>
        <h2 className="font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      </div>
      <Link
        href={href}
        className="flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
      >
        View all <ChevronRight className="size-3.5" />
      </Link>
    </div>
  );
}

export default function HrPage() {
  const dashboard = useQuery({
    queryKey: ['dashboard', 'hr'],
    queryFn: dashboardServer.hr,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  if (dashboard.isLoading) return <DashboardSkeleton />;

  if (dashboard.isError || !dashboard.data) {
    return (
      <section className="grid min-h-[65vh] place-items-center rounded-3xl border border-rose-100 bg-white p-8 text-center shadow-sm">
        <div>
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
            <Activity className="size-6" />
          </span>
          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Dashboard data could not be loaded
          </h1>
          <p className="mt-2 text-sm text-slate-500">Check the connection and try again.</p>
          <button
            type="button"
            onClick={() => dashboard.refetch()}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <RefreshCw className="size-4" /> Retry
          </button>
        </div>
      </section>
    );
  }

  const data = dashboard.data;
  const pendingTotal =
    data.summary.pendingLeaves +
    data.summary.pendingAdvances +
    data.summary.pendingLoans +
    data.summary.pendingDocuments;
  const summaryCards = [
    {
      label: 'Total team members',
      value: data.summary.totalTeamMembers,
      detail: `${data.summary.activeTeamMembers} active accounts`,
      icon: UsersRound,
      href: '/hr/employees',
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Present today',
      value: data.summary.presentToday,
      detail: `${data.summary.absentToday} absent today`,
      icon: CalendarCheck2,
      href: '/hr/attendance',
      tone: 'bg-sky-50 text-sky-700',
    },
    {
      label: 'Pending approvals',
      value: pendingTotal,
      detail: 'Across HR requests',
      icon: FileCheck2,
      href: '/hr/leave',
      tone: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Open work',
      value: data.summary.openTasks,
      detail: `${data.summary.activeProjects} active projects`,
      icon: ListTodo,
      href: '/hr/tasks',
      tone: 'bg-violet-50 text-violet-700',
    },
  ];
  const approvalCards = [
    {
      label: 'Pending leave',
      value: data.summary.pendingLeaves,
      detail: 'Leave requests to review',
      href: '/hr/leave',
      icon: CalendarCheck2,
      tone: 'bg-sky-50 text-sky-700',
    },
    {
      label: 'Salary advances',
      value: data.summary.pendingAdvances,
      detail: 'Advance requests to review',
      href: '/hr/advances',
      icon: HandCoins,
      tone: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Loan requests',
      value: data.summary.pendingLoans,
      detail: 'Loan requests to review',
      href: '/hr/loans',
      icon: ReceiptText,
      tone: 'bg-violet-50 text-violet-700',
    },
    {
      label: 'Document reviews',
      value: data.summary.pendingDocuments,
      detail: 'Documents awaiting review',
      href: '/hr/documents',
      icon: FileCheck2,
      tone: 'bg-rose-50 text-rose-700',
    },
  ];

  return (
    <section className="w-full space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-700 via-emerald-600 to-teal-500 p-6 text-white shadow-lg shadow-emerald-900/10 sm:p-8">
        <div className="absolute -right-12 -top-16 size-52 rounded-full bg-white/10" />
        <div className="absolute -bottom-24 right-28 size-56 rounded-full bg-teal-300/10" />
        <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-100">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-200 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-white" />
              </span>
              Live operations overview
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">HR dashboard</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/90 sm:text-base">
              Employees, attendance, payroll and approval activity from your WorkPilot database.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium backdrop-blur">
              Updated {formatTime(data.generatedAt)}
            </span>
            <Link
              href="/hr/employees/create"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
            >
              <UserPlus className="size-4" /> Add employee
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ label, value, detail, icon: Icon, href, tone }) => (
          <Link
            href={href}
            key={label}
            className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <span className={`grid size-9 place-items-center rounded-xl ${tone}`}>
                <Icon className="size-4" />
              </span>
              <ChevronRight className="size-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-600" />
            </div>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-700">{label}</p>
                <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
              </div>
              <p className="shrink-0 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="font-bold text-slate-900">Approval queue</h2>
          <p className="mt-1 text-xs text-slate-500">
            Pending requests that still require an HR decision.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {approvalCards.map(({ label, value, detail, href, icon: Icon, tone }) => (
            <Link
              key={label}
              href={href}
              className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <span className={`grid size-9 place-items-center rounded-xl ${tone}`}>
                  <Icon className="size-4" />
                </span>
                <ChevronRight className="size-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-600" />
              </div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">{label}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
                </div>
                <p className="shrink-0 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.75fr]">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <PanelHeader
            title="Today's attendance"
            subtitle={`${data.summary.presentToday} of ${data.summary.activeEmployees} active employees present`}
            href="/hr/attendance"
          />
          <div className="overflow-x-auto">
            {data.attendance.rows.length ? (
              <table className="w-full min-w-170 text-left">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-bold">Employee</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 font-bold">Check in</th>
                    <th className="px-4 py-3 font-bold">Site / shift</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.attendance.rows.map((row) => (
                    <tr key={row.employee.id} className="hover:bg-slate-50/70">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-xs font-bold text-emerald-700">
                            {initials(row.employee.fullName, row.employee.employeeId)}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {row.employee.fullName || row.employee.employeeId}
                            </p>
                            <p className="text-xs text-slate-500">{row.employee.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${
                            row.status === 'absent'
                              ? 'bg-rose-50 text-rose-700'
                              : row.status === 'working'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm font-medium text-slate-700">
                        {formatTime(row.checkInAt)}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-medium text-slate-700">{row.site || '—'}</p>
                        <p className="text-xs text-slate-500">{row.shift || 'No shift'}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-5">
                <EmptyState text="No active employees are available for today's attendance." />
              </div>
            )}
          </div>
        </article>

        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <PanelHeader
            title="Payroll snapshot"
            subtitle="Latest generated payroll"
            href="/hr/payroll"
          />
          <div className="p-5 sm:p-6">
            {data.payroll ? (
              <>
                <div className="rounded-2xl bg-slate-900 p-5 text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Net payroll
                    </span>
                    <CircleDollarSign className="size-5 text-emerald-400" />
                  </div>
                  <p className="mt-4 text-3xl font-bold tracking-tight">
                    {money.format(data.payroll.net)}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {data.payroll.month} · {data.payroll.records} records
                  </p>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Gross</p>
                    <p className="mt-1 text-sm font-bold text-slate-800">
                      {money.format(data.payroll.gross)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Deductions</p>
                    <p className="mt-1 text-sm font-bold text-slate-800">
                      {money.format(data.payroll.deductions)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3">
                    <p className="text-xs text-emerald-700">Paid</p>
                    <p className="mt-1 text-lg font-bold text-emerald-800">{data.payroll.paid}</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-3">
                    <p className="text-xs text-amber-700">Upcoming</p>
                    <p className="mt-1 text-lg font-bold text-amber-800">{data.payroll.upcoming}</p>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState text="No payroll has been generated yet." />
            )}
          </div>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <PanelHeader
            title="Pending requests"
            subtitle="Latest items awaiting HR review"
            href="/hr/leave"
          />
          <div className="space-y-2 p-4 sm:p-5">
            {data.pendingRequests.length ? (
              data.pendingRequests.map((request) => (
                <Link
                  key={`${request.type}-${request.id}`}
                  href={request.href}
                  className="flex items-center gap-3 rounded-xl border border-transparent p-3 transition hover:border-emerald-100 hover:bg-emerald-50/60"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700">
                    <Clock3 className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-slate-800">
                        {request.employee}
                      </p>
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                        {request.type}
                      </span>
                    </div>
                    <p className="truncate text-xs text-slate-500">{request.detail}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {request.amount !== null && (
                      <p className="text-sm font-bold text-slate-800">
                        {money.format(request.amount)}
                      </p>
                    )}
                    <p className="text-xs text-slate-400">{formatDate(request.createdAt)}</p>
                  </div>
                </Link>
              ))
            ) : (
              <EmptyState text="There are no pending requests to review." />
            )}
          </div>
        </article>

        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <PanelHeader
            title="Priority tasks"
            subtitle="Open employee work requiring attention"
            href="/hr/tasks"
          />
          <div className="space-y-2 p-4 sm:p-5">
            {data.tasks.length ? (
              data.tasks.map((task) => (
                <Link
                  key={task.id}
                  href="/hr/tasks"
                  className="flex items-center gap-3 rounded-xl border border-transparent p-3 transition hover:border-violet-100 hover:bg-violet-50/50"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700">
                    <ListTodo className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">{task.title}</p>
                    <p className="truncate text-xs text-slate-500">
                      {task.user.fullName || task.user.employeeId} · Due {formatDate(task.dueDate)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                      task.priority === 'high'
                        ? 'bg-rose-50 text-rose-700'
                        : task.priority === 'medium'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {task.priority}
                  </span>
                </Link>
              ))
            ) : (
              <EmptyState text="There are no open assigned tasks." />
            )}
          </div>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <PanelHeader
            title="Recent employees"
            subtitle="Latest employee records"
            href="/hr/employees"
          />
          <div className="space-y-2 p-4 sm:p-5">
            {data.recentEmployees.length ? (
              data.recentEmployees.map((employee) => (
                <Link
                  key={employee.id}
                  href="/hr/employees"
                  className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-slate-50"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-xs font-bold text-emerald-700">
                    {initials(employee.fullName, employee.employeeId)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {employee.fullName || employee.employeeId}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {employee.designation || 'No designation'} ·{' '}
                      {employee.defaultSite?.name || 'No site'}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${employee.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
                  >
                    {employee.isActive ? 'Active' : 'Suspended'}
                  </span>
                </Link>
              ))
            ) : (
              <EmptyState text="No employee records are available." />
            )}
          </div>
        </article>

        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <PanelHeader
            title="Announcements"
            subtitle="Latest active company notices"
            href="/hr/announcements"
          />
          <div className="space-y-3 p-4 sm:p-5">
            {data.announcements.length ? (
              data.announcements.map((announcement) => (
                <Link
                  key={announcement.id}
                  href="/hr/announcements"
                  className="block rounded-xl border border-slate-100 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-700">
                      <BellRing className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-bold text-slate-800">
                          {announcement.title}
                        </p>
                        {announcement.isPinned && (
                          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-700">
                            Pinned
                          </span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                        {announcement.content}
                      </p>
                      <p className="mt-2 text-[11px] text-slate-400">
                        {formatDate(announcement.publishedAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <EmptyState text="No active announcements are available." />
            )}
          </div>
        </article>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/hr/payroll"
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700 shadow-sm hover:border-emerald-200"
        >
          <WalletCards className="size-5 text-emerald-600" /> Manage payroll
        </Link>
        <Link
          href="/hr/projects"
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700 shadow-sm hover:border-emerald-200"
        >
          <FolderKanban className="size-5 text-emerald-600" /> Assign projects
        </Link>
        <Link
          href="/hr/announcements"
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700 shadow-sm hover:border-emerald-200"
        >
          <BellRing className="size-5 text-emerald-600" /> Publish announcement
        </Link>
      </div>
    </section>
  );
}
