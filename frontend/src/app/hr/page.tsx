import { BellRing, CalendarDays, FileText, HandCoins, UsersRound, WalletCards } from 'lucide-react';
import Link from 'next/link';
const cards = [
  {
    title: 'Employees',
    text: 'Create, update, deactivate and view employee records.',
    href: '/hr/employees',
    icon: UsersRound,
  },
  {
    title: 'Attendance',
    text: 'Review check-in, check-out and monthly attendance.',
    href: '/hr/attendance',
    icon: CalendarDays,
  },
  {
    title: 'Leave requests',
    text: 'Review employee leave requests and balances.',
    href: '/hr/leave',
    icon: CalendarDays,
  },
  {
    title: 'Payroll & salary',
    text: 'Manage salary, deductions and payment records.',
    href: '/hr/payroll',
    icon: WalletCards,
  },
  {
    title: 'Salary advances & loans',
    text: 'Review requests and manage repayment workflow.',
    href: '/hr/advances',
    icon: HandCoins,
  },
  {
    title: 'Documents & notices',
    text: 'Review employee documents and publish announcements.',
    href: '/hr/documents',
    icon: FileText,
  },
];
export default function HrPage() {
  return (
    <section className="w-full space-y-6">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">HR workspace</p>
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 p-8 text-white">
        <BellRing className="size-8 text-emerald-100" />
        <h1 className="mt-5 text-3xl font-bold">HR dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50">
          Manage employee operations, approvals, payroll and workplace information from one
          organised workspace.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ title, text, href, icon: Icon }) => (
          <Link
            href={href}
            key={title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
              <Icon className="size-5" />
            </span>
            <h2 className="mt-4 font-bold text-slate-800">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">{text}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
