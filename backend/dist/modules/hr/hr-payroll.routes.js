import { getCookie } from 'hono/cookie';
import { Hono } from 'hono';
import { z } from 'zod';
import { getListQuery, pagination } from '../../lib/list-query.js';
import { prisma } from '../../lib/prisma.js';
import { getCurrentUser } from '../auth/auth.service.js';
const payrollSchema = z.object({
    userId: z.string().min(1),
    month: z.string().min(3),
    period: z.string().min(3),
    basic: z.number().int().nonnegative(),
    allowances: z.number().int().nonnegative(),
    bonus: z.number().int().nonnegative(),
    tax: z.number().int().nonnegative(),
    providentFund: z.number().int().nonnegative(),
    status: z.enum(['upcoming', 'paid']),
    paidOn: z.string().optional(),
});
const payrollStatusSchema = z.object({ status: z.enum(['upcoming', 'paid']) });
const payrollMonths = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
];
function previousPayrollMonth() {
    const current = new Date();
    return new Date(current.getFullYear(), current.getMonth() - 1, 1);
}
function payrollMonthLabel(date) {
    return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        year: 'numeric',
    }).format(date);
}
function allowedPayrollMonth(value) {
    if (!value)
        return null;
    const match = value
        .trim()
        .toLowerCase()
        .match(/^([a-z]+)\s+(\d{4})$/);
    if (!match)
        return null;
    const month = payrollMonths.indexOf(match[1]);
    if (month < 0)
        return null;
    const selected = new Date(Number(match[2]), month, 1);
    return selected.getTime() <= previousPayrollMonth().getTime()
        ? payrollMonthLabel(selected)
        : null;
}
function exactDateRange(value) {
    const match = value.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!match)
        return null;
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const gte = new Date(Date.UTC(year, month, day));
    if (gte.getUTCFullYear() !== year || gte.getUTCMonth() !== month || gte.getUTCDate() !== day) {
        return null;
    }
    const lt = new Date(gte);
    lt.setUTCDate(lt.getUTCDate() + 1);
    return { gte, lt };
}
async function authorizeHr(c) {
    try {
        const user = await getCurrentUser(getCookie(c, 'workpilot_access') ?? '');
        return user.role === 'hr' ? user : null;
    }
    catch {
        return null;
    }
}
export const hrPayrollRoutes = new Hono()
    .get('/', async (c) => {
    if (!(await authorizeHr(c)))
        return c.json({ message: 'Unauthorized.' }, 403);
    const query = getListQuery(c);
    const status = ['upcoming', 'paid'].includes(query.status ?? '') ? query.status : undefined;
    const month = allowedPayrollMonth(c.req.query('month')) ?? payrollMonthLabel(previousPayrollMonth());
    const numericValue = query.search.replace(/[$,\s]/g, '');
    const amount = /^\d+$/.test(numericValue) ? Number(numericValue) : null;
    const dateRange = exactDateRange(query.search);
    const where = {
        user: { is: { isActive: true, role: { in: ['employee', 'hr'] } } },
        ...(status ? { status } : {}),
        month,
        ...(query.search
            ? {
                OR: [
                    { month: { contains: query.search, mode: 'insensitive' } },
                    { period: { contains: query.search, mode: 'insensitive' } },
                    { status: { contains: query.search, mode: 'insensitive' } },
                    {
                        user: {
                            is: {
                                OR: [
                                    { employeeId: { contains: query.search, mode: 'insensitive' } },
                                    { fullName: { contains: query.search, mode: 'insensitive' } },
                                    { email: { contains: query.search, mode: 'insensitive' } },
                                    { phone: { contains: query.search, mode: 'insensitive' } },
                                    { companyName: { contains: query.search, mode: 'insensitive' } },
                                    { department: { contains: query.search, mode: 'insensitive' } },
                                    { designation: { contains: query.search, mode: 'insensitive' } },
                                    { role: { contains: query.search, mode: 'insensitive' } },
                                    { address: { contains: query.search, mode: 'insensitive' } },
                                    { gender: { contains: query.search, mode: 'insensitive' } },
                                    { employmentType: { contains: query.search, mode: 'insensitive' } },
                                    { employmentStatus: { contains: query.search, mode: 'insensitive' } },
                                    { salaryType: { contains: query.search, mode: 'insensitive' } },
                                ],
                            },
                        },
                    },
                    ...(amount === null
                        ? []
                        : [
                            { basic: amount },
                            { allowances: amount },
                            { bonus: amount },
                            { tax: amount },
                            { providentFund: amount },
                        ]),
                    ...(dateRange ? [{ paidOn: dateRange }, { createdAt: dateRange }] : []),
                ],
            }
            : {}),
    };
    const [payments, total, employees, months] = await Promise.all([
        prisma.salaryPayment.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: query.skip,
            take: query.limit,
            include: { user: { select: { employeeId: true, fullName: true, role: true } } },
        }),
        prisma.salaryPayment.count({ where }),
        prisma.user.findMany({
            where: { role: { in: ['employee', 'hr'] }, isActive: true },
            orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
            select: { id: true, employeeId: true, fullName: true, role: true },
        }),
        prisma.salaryPayment.findMany({
            distinct: ['month'],
            orderBy: { createdAt: 'desc' },
            select: { month: true },
        }),
    ]);
    return c.json({
        payments,
        employees,
        months: months.map((item) => item.month),
        pagination: pagination(total, query.page, query.limit),
    });
})
    .post('/generate', async (c) => {
    if (!(await authorizeHr(c)))
        return c.json({ message: 'Unauthorized.' }, 403);
    const payrollDate = previousPayrollMonth();
    const month = payrollMonthLabel(payrollDate);
    const lastDay = new Date(payrollDate.getFullYear(), payrollDate.getMonth() + 1, 0).getDate();
    const period = `1–${lastDay} ${month}`;
    const employees = await prisma.user.findMany({
        where: { role: { in: ['employee', 'hr'] }, isActive: true },
        select: {
            id: true,
            basicSalary: true,
            salaryAllowances: true,
            salaryBonus: true,
            salaryTax: true,
            salaryProvidentFund: true,
        },
    });
    let generated = 0;
    for (const employee of employees) {
        const latest = await prisma.salaryPayment.findFirst({
            where: { userId: employee.id },
            orderBy: { createdAt: 'desc' },
        });
        await prisma.salaryPayment.upsert({
            where: { userId_month: { userId: employee.id, month } },
            update: {},
            create: {
                userId: employee.id,
                month,
                period,
                basic: employee.basicSalary || latest?.basic || 0,
                allowances: employee.basicSalary ? employee.salaryAllowances : (latest?.allowances ?? 0),
                bonus: employee.basicSalary ? employee.salaryBonus : (latest?.bonus ?? 0),
                tax: employee.basicSalary ? employee.salaryTax : (latest?.tax ?? 0),
                providentFund: employee.basicSalary
                    ? employee.salaryProvidentFund
                    : (latest?.providentFund ?? 0),
                status: 'upcoming',
            },
        });
        generated += 1;
    }
    return c.json({ month, generated });
})
    .post('/', async (c) => {
    if (!(await authorizeHr(c)))
        return c.json({ message: 'Unauthorized.' }, 403);
    const result = payrollSchema.safeParse(await c.req.json().catch(() => null));
    if (!result.success)
        return c.json({ message: 'Invalid payroll data.' }, 400);
    const { userId, month, paidOn, ...rest } = result.data;
    const payment = await prisma.$transaction(async (transaction) => {
        const saved = await transaction.salaryPayment.upsert({
            where: { userId_month: { userId, month } },
            update: { ...rest, paidOn: paidOn ? new Date(paidOn) : null },
            create: {
                ...rest,
                userId,
                month,
                paidOn: paidOn ? new Date(paidOn) : null,
            },
        });
        await transaction.user.update({
            where: { id: userId },
            data: {
                basicSalary: rest.basic,
                salaryAllowances: rest.allowances,
                salaryBonus: rest.bonus,
                salaryTax: rest.tax,
                salaryProvidentFund: rest.providentFund,
            },
        });
        return saved;
    });
    return c.json({ payment });
})
    .patch('/:id/status', async (c) => {
    if (!(await authorizeHr(c)))
        return c.json({ message: 'Unauthorized.' }, 403);
    const result = payrollStatusSchema.safeParse(await c.req.json().catch(() => null));
    if (!result.success)
        return c.json({ message: 'Select a valid payroll status.' }, 400);
    const payment = await prisma.salaryPayment
        .update({
        where: { id: c.req.param('id') },
        data: {
            status: result.data.status,
            paidOn: result.data.status === 'paid' ? new Date() : null,
        },
        include: { user: { select: { employeeId: true, fullName: true, role: true } } },
    })
        .catch(() => null);
    return payment ? c.json({ payment }) : c.json({ message: 'Payroll record not found.' }, 404);
});
