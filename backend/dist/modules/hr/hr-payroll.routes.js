import { getCookie } from 'hono/cookie';
import { Hono } from 'hono';
import { prisma } from '../../lib/prisma.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { z } from 'zod';
async function currentUser(c) { try {
    return await getCurrentUser(getCookie(c, 'workpilot_access') ?? '');
}
catch {
    return null;
} }
const schema = z.object({ userId: z.string().min(1), month: z.string().min(3), period: z.string().min(3), basic: z.number().int().nonnegative(), allowances: z.number().int().nonnegative(), bonus: z.number().int().nonnegative(), tax: z.number().int().nonnegative(), providentFund: z.number().int().nonnegative(), status: z.enum(['upcoming', 'paid']), paidOn: z.string().optional() });
export const hrPayrollRoutes = new Hono().get('/', async (c) => { const user = await currentUser(c); if (!user || !['hr', 'admin'].includes(user.role))
    return c.json({ message: 'Unauthorized.' }, 403); const [payments, employees] = await Promise.all([prisma.salaryPayment.findMany({ orderBy: { createdAt: 'desc' }, include: { user: { select: { employeeId: true, fullName: true } } } }), prisma.user.findMany({ where: { role: 'employee', isActive: true }, select: { id: true, employeeId: true, fullName: true } })]); return c.json({ payments, employees }); }).post('/generate', async (c) => { const user = await currentUser(c); if (!user || !['hr', 'admin'].includes(user.role))
    return c.json({ message: 'Unauthorized.' }, 403); const now = new Date(); const payrollDate = new Date(now.getFullYear(), now.getMonth() - 1, 1); const month = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(payrollDate); const period = `1–${new Date(payrollDate.getFullYear(), payrollDate.getMonth() + 1, 0).getDate()} ${month}`; const employees = await prisma.user.findMany({ where: { role: 'employee', isActive: true }, select: { id: true } }); let generated = 0; for (const employee of employees) {
    const latest = await prisma.salaryPayment.findFirst({ where: { userId: employee.id }, orderBy: { createdAt: 'desc' } });
    if (!latest)
        continue;
    await prisma.salaryPayment.upsert({ where: { userId_month: { userId: employee.id, month } }, update: {}, create: { userId: employee.id, month, period, basic: latest.basic, allowances: latest.allowances, bonus: 0, tax: latest.tax, providentFund: latest.providentFund, status: 'upcoming' } });
    generated++;
} return c.json({ month, generated }); }).post('/', async (c) => { const user = await currentUser(c); if (!user || !['hr', 'admin'].includes(user.role))
    return c.json({ message: 'Unauthorized.' }, 403); const data = schema.safeParse(await c.req.json().catch(() => null)); if (!data.success)
    return c.json({ message: 'Invalid payroll data.' }, 400); const { userId, month, paidOn, ...rest } = data.data; const payment = await prisma.salaryPayment.upsert({ where: { userId_month: { userId, month } }, update: { ...rest, paidOn: paidOn ? new Date(paidOn) : null }, create: { ...rest, userId, month, paidOn: paidOn ? new Date(paidOn) : null } }); return c.json({ payment }); });
