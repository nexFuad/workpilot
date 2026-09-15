import { getCookie } from 'hono/cookie';
import { Hono, type Context } from 'hono';
import { getListQuery, pagination } from '../../lib/list-query.js';
import { prisma } from '../../lib/prisma.js';
import { getCurrentUser } from '../auth/auth.service.js';

async function currentUser(c: Context) {
  try {
    return await getCurrentUser(getCookie(c, 'workpilot_access') ?? '');
  } catch {
    return null;
  }
}
const timeValue = (date: Date) => date.getHours() * 60 + date.getMinutes();
const clock = (value: string) => {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
};
export const hrAttendanceRoutes = new Hono().get('/', async (c) => {
  const user = await currentUser(c);
  if (!user) return c.json({ message: 'Unauthorized.' }, 401);
  if (user.role !== 'hr') return c.json({ message: 'Unauthorized.' }, 403);
  const query = getListQuery(c);
  const rawDate = c.req.query('date') ?? new Date().toISOString().slice(0, 10);
  const start = new Date(`${rawDate}T00:00:00.000Z`);
  const end = new Date(`${rawDate}T23:59:59.999Z`);
  if (Number.isNaN(start.getTime())) return c.json({ message: 'Invalid date.' }, 400);
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
      where: { checkInAt: { gte: start, lte: end } },
      include: { checkInSite: true, checkInShift: true, checkOutSite: true, checkOutShift: true },
    }),
  ]);
  const byEmployee = new Map(records.map((record) => [record.userId, record]));
  const attendance = employees.map((employee) => {
    const record = byEmployee.get(employee.id);
    if (!record)
      return { employee, status: 'absent', attendance: null, lateMinutes: 0, overtimeMinutes: 0 };
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
  return c.json({
    date: rawDate,
    attendance: filtered.slice(query.skip, query.skip + query.limit),
    summary,
    pagination: pagination(filtered.length, query.page, query.limit),
  });
});
