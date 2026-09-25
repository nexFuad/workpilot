import type { Attendance } from '@/types/attendance.types';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
export function AttendanceHistoryCard({ attendance }: { attendance: Attendance }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-800">{attendance.checkInSite.name}</p>
          <p className="mt-1 text-sm text-slate-500">{attendance.checkInShift.name}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${attendance.checkOutAt ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}
        >
          {attendance.checkOutAt ? 'Work completed' : 'On working'}
        </span>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-2 text-sm text-slate-600">
          <p>
            <span className="font-medium text-sky-700">Check in: </span>
            {formatDate(attendance.checkInAt)}
          </p>
          <p>
            <span className="font-medium text-slate-700">Check out: </span>
            {attendance.checkOutAt ? formatDate(attendance.checkOutAt) : 'Pending'}
          </p>
        </div>
        <div className="flex gap-3">
          <figure>
            <span
              style={{ backgroundImage: `url(${attendance.checkInPhotoUrl})` }}
              className="block size-14 rounded-xl bg-sky-50 bg-cover bg-center"
            />
            <figcaption className="mt-1 text-center text-[10px] font-semibold text-sky-700">
              Check-in photo
            </figcaption>
          </figure>
          {attendance.checkOutPhotoUrl && (
            <figure>
              <span
                style={{ backgroundImage: `url(${attendance.checkOutPhotoUrl})` }}
                className="block size-14 rounded-xl bg-sky-50 bg-cover bg-center"
              />
              <figcaption className="mt-1 text-center text-[10px] font-semibold text-emerald-700">
                Check-out photo
              </figcaption>
            </figure>
          )}
        </div>
      </div>
    </article>
  );
}
