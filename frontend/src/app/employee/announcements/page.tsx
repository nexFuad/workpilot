'use client';
import { BellRing, Pin } from 'lucide-react';
import { EmployeeHeader } from '@/components/employee/EmployeeHeader';
import { useAnnouncements } from '@/hooks/use-announcements';
const styles: Record<string, string> = {
  urgent: 'bg-rose-100 text-rose-700',
  important: 'bg-amber-100 text-amber-700',
  normal: 'bg-sky-100 text-sky-700',
};
export default function AnnouncementsPage() {
  const announcements = useAnnouncements();
  const items = announcements.data?.announcements ?? [];
  return (
    <section className="w-full space-y-6 pb-8">
      <EmployeeHeader
        title="Announcements"
        description="Stay updated with the latest company news and important notices."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-600 to-cyan-500 p-5 text-white shadow-sm">
          <div className="flex justify-between">
            <p className="text-sm font-medium text-sky-100">Latest updates</p>
            <BellRing className="size-5" />
          </div>
          <p className="mt-5 text-2xl font-bold">{items.length}</p>
          <p className="mt-1 text-xs text-sky-100">Company announcements</p>
        </article>
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="font-bold text-slate-800">Company notices</h2>
          <p className="mt-1 text-sm text-slate-500">Published by HR and administrators.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {announcements.isLoading ? (
            <p className="p-6 text-sm text-slate-500">Loading announcements…</p>
          ) : items.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              No announcements at the moment.
            </p>
          ) : (
            items.map((item) => (
              <article key={item.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {item.isPinned && <Pin className="size-4 text-sky-600" />}
                    <h2 className="font-bold text-slate-800">{item.title}</h2>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${styles[item.priority] ?? styles.normal}`}
                  >
                    {item.priority}
                  </span>
                </div>
                <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">{item.content}</p>
                <p className="mt-4 text-xs font-medium text-slate-400">
                  Published{' '}
                  {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
                    new Date(item.publishedAt),
                  )}
                </p>
              </article>
            ))
          )}
        </div>
      </section>
    </section>
  );
}
