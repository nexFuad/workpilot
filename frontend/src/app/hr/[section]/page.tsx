import {
  ClipboardCheck,
  FileText,
  HandCoins,
  Megaphone,
  Settings2,
  UsersRound,
  WalletCards,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const details: Record<
  string,
  { title: string; description: string; icon: typeof UsersRound; actions: string[] }
> = {
  payroll: {
    title: 'Payroll & salary',
    description: 'Set employee salary, create payroll records, and review deductions.',
    icon: WalletCards,
    actions: ['Set or update salary', 'Create payroll records', 'Review salary history'],
  },
  advances: {
    title: 'Salary advances',
    description: 'Review employee advance requests and approve or reject them.',
    icon: HandCoins,
    actions: ['Review requests', 'Approve or reject', 'Track monthly adjustments'],
  },
  loans: {
    title: 'Employee loans',
    description: 'Review loan applications, instalments, and repayment history.',
    icon: WalletCards,
    actions: ['Review applications', 'Approve or reject', 'Manage instalments'],
  },
  documents: {
    title: 'Employee documents',
    description: 'Review uploaded employee documents and update their status.',
    icon: FileText,
    actions: ['View documents', 'Approve or reject', 'Add a reviewer note'],
  },
  announcements: {
    title: 'Announcements',
    description: 'Publish company notices and keep employees informed.',
    icon: Megaphone,
    actions: ['Create notice', 'Pin important notice', 'Manage published notices'],
  },
  sites: {
    title: 'Sites',
    description: 'Manage attendance locations and their availability.',
    icon: Settings2,
    actions: ['Create site', 'Edit site', 'Activate or deactivate'],
  },
  shifts: {
    title: 'Shifts',
    description: 'Manage company shift schedules.',
    icon: ClipboardCheck,
    actions: ['Create shift', 'Edit shift', 'Activate or deactivate'],
  },
  account: {
    title: 'My account',
    description: 'Manage your HR account and profile settings.',
    icon: UsersRound,
    actions: ['Update profile', 'Change password', 'Manage contact information'],
  },
};
export default async function HrSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const item = details[section];
  if (!item) notFound();
  const Icon = item.icon;
  return (
    <section className="w-full space-y-6">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">HR workspace</p>
      <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-600 to-teal-500 p-7 text-white">
        <Icon className="size-8 text-emerald-100" />
        <h1 className="mt-5 text-3xl font-bold">{item.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50">{item.description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {item.actions.map((action) => (
          <article
            key={action}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="font-bold text-slate-800">{action}</h2>
            <p className="mt-2 text-sm text-slate-500">
              This HR workflow is ready to be connected to its management controls.
            </p>
          </article>
        ))}
      </div>
      <Link
        href="/hr"
        className="inline-flex rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
      >
        Back to dashboard
      </Link>
    </section>
  );
}
