import { ApiError } from '../../lib/api-error.js';
import { utcDayRange } from '../../lib/date.js';
import { pagination, type ListQuery } from '../../lib/list-query.js';
import { prisma } from '../../lib/prisma.js';

const timeValue = (date: Date) => date.getHours() * 60 + date.getMinutes();
const clock = (value: string) => {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
};

export async function getDailyAttendance(rawDate: string, query: ListQuery) {
  const range = utcDayRange(rawDate);
  if (!range) throw new ApiError(400, 'Invalid date.');
  const [employees, records] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: 'employee',
        isActive: true,
        ...(query.search
          ? {
              OR: [
                { employeeId: { contains: query.search, mode: 'insensitive' as const } },
                { fullName: { contains: query.search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      select: { id: true, employeeId: true, fullName: true, companyName: true, profileImage: true },
    }),
    prisma.attendance.findMany({
      where: { checkInAt: range },
      include: { checkInSite: true, checkInShift: true, checkOutSite: true, checkOutShift: true },
    }),
  ]);
  const byEmployee = new Map(records.map((record) => [record.userId, record]));
  const attendance = employees.map((employee) => {
    const record = byEmployee.get(employee.id);
    if (!record) {
      return { employee, status: 'absent', attendance: null, lateMinutes: 0, overtimeMinutes: 0 };
    }
    const lateMinutes = Math.max(
      timeValue(record.checkInAt) - clock(record.checkInShift.startTime),
      0,
    );
    const overtimeMinutes = record.checkOutAt
      ? Math.max(
          timeValue(record.checkOutAt) -
            clock(record.checkOutShift?.endTime ?? record.checkInShift.endTime),
          0,
        )
      : 0;
    return {
      employee,
      status: lateMinutes > 0 ? 'late' : record.checkOutAt ? 'present' : 'working',
      attendance: record,
      lateMinutes,
      overtimeMinutes,
    };
  });
  const summary = {
    total: employees.length,
    present: attendance.filter((row) => ['present', 'working', 'late'].includes(row.status)).length,
    absent: attendance.filter((row) => row.status === 'absent').length,
    late: attendance.filter((row) => row.status === 'late').length,
    overtime: attendance.filter((row) => row.overtimeMinutes > 0).length,
  };
  const filtered = query.status
    ? attendance.filter((row) => row.status === query.status)
    : attendance;
  return {
    date: rawDate,
    attendance: filtered.slice(query.skip, query.skip + query.limit),
    summary,
    pagination: pagination(filtered.length, query.page, query.limit),
  };
}
