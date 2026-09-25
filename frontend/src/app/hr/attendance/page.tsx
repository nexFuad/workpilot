'use client';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Timer, UsersRound } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { hrAttendanceServer } from '@/server/hr-attendance.server';
import { HrHeader } from '@/components/hr/HrHeader';
import { Pagination } from '@/components/shared/Pagination';
const today = new Date().toISOString().slice(0, 10);
const time = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(
        new Date(value),
      )
    : '—';
const statusStyle: Record<string, string> = {
  present: 'bg-emerald-100 text-emerald-700',
  working: 'bg-sky-100 text-sky-700',
  late: 'bg-amber-100 text-amber-700',
  absent: 'bg-rose-100 text-rose-700',
};
export default function AttendancePage() {
  const [date, setDate] = useState(today);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const params = { date, status: filter, page, limit: 10 };
  const report = useQuery({
    queryKey: ['hr', 'attendance', params],
    queryFn: () => hrAttendanceServer.list(params),
  });
  const data = report.data;
  const rows = data?.attendance ?? [];
  return (
    <section className="w-full space-y-6">
      <HrHeader
        title="Attendance"
        description="Review employee check-in, check-out, absence and overtime."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Employees', value: data?.summary.total ?? 0, icon: UsersRound },
          { label: 'Present', value: data?.summary.present ?? 0, icon: UsersRound },
          { label: 'Absent', value: data?.summary.absent ?? 0, icon: UsersRound },
          { label: 'Overtime', value: data?.summary.overtime ?? 0, icon: Timer },
        ].map(({ label, value, icon: Icon }) => (
          <article
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <Icon className="size-5 text-emerald-600" />
            {report.isLoading ? (
              <span className="mt-4 block h-7 w-16 animate-pulse rounded bg-slate-100" />
            ) : (
              <p className="mt-4 text-2xl font-bold text-slate-800">{value}</p>
            )}
            <p className="mt-1 text-sm text-slate-500">{label}</p>
          </article>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <CalendarDays className="size-5 text-emerald-600" />
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-400"
        />
        <div className="ml-auto flex flex-wrap gap-2">
          {['all', 'present', 'absent', 'working'].map((item) => (
            <button
              key={item}
              onClick={() => {
                setFilter(item);
                setPage(1);
              }}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${filter === item ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="font-bold text-slate-800">Daily attendance register</h2>
          <p className="mt-1 text-sm text-slate-500">
            {new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(
              new Date(`${date}T12:00:00`),
            )}
          </p>
        </div>
        <div className="h-[70vh] overflow-auto">
          <table className="w-full min-w-275 text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Employee</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Check in</th>
                <th className="px-5 py-3">Check out</th>
                <th className="px-5 py-3">Check-in photo</th>
                <th className="px-5 py-3">Check-out photo</th>
                <th className="px-5 py-3">Site</th>
                <th className="px-5 py-3">Shift</th>
                <th className="px-5 py-3">Overtime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.isLoading
                ? Array.from({ length: 10 }, (_, row) => (
                    <tr key={row} className="animate-pulse">
                      {Array.from({ length: 9 }, (_, column) => (
                        <td key={column} className="px-5 py-4">
                          <span
                            className={`block h-4 rounded bg-slate-100 ${column === 0 ? 'w-28' : column === 4 || column === 5 ? 'size-10' : 'w-16'}`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.map((row) => (
                    <tr key={row.employee.id}>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {row.employee.fullName || row.employee.employeeId}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{row.employee.employeeId}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle[row.status]}`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-700">
                        {time(row.attendance?.checkInAt ?? null)}
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-700">
                        {time(row.attendance?.checkOutAt ?? null)}
                      </td>
                      <td className="px-5 py-4">
                        {row.attendance?.checkInPhotoUrl ? (
                          <a href={row.attendance.checkInPhotoUrl} target="_blank" rel="noreferrer">
                            <Image
                              src={row.attendance.checkInPhotoUrl}
                              alt="Check-in"
                              width={40}
                              height={40}
                              className="size-10 rounded-lg object-cover ring-1 ring-slate-200"
                            />
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {row.attendance?.checkOutPhotoUrl ? (
                          <a
                            href={row.attendance.checkOutPhotoUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Image
                              src={row.attendance.checkOutPhotoUrl}
                              alt="Check-out"
                              width={40}
                              height={40}
                              className="size-10 rounded-lg object-cover ring-1 ring-slate-200"
                            />
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {row.attendance?.checkInSite.name ?? '—'}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {row.attendance?.checkInShift.name ?? '—'}
                      </td>
                      <td className="px-5 py-4 font-semibold text-emerald-700">
                        {row.overtimeMinutes ? `${row.overtimeMinutes} min` : '—'}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-5 py-4">
          <Pagination
            page={data?.pagination.page ?? page}
            totalItems={data?.pagination.total ?? 0}
            pageSize={10}
            onPageChange={setPage}
          />
        </div>
      </section>
    </section>
  );
}
