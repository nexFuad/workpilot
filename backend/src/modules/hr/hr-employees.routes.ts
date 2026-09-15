import { hash } from 'bcryptjs';
import { getCookie } from 'hono/cookie';
import { Hono, type Context } from 'hono';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { getListQuery, pagination } from '../../lib/list-query.js';
import { prisma } from '../../lib/prisma.js';
import { getCurrentUser } from '../auth/auth.service.js';

const optionalText = (maximum: number) => z.string().trim().max(maximum).optional().default('');
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .or(z.literal(''));

const employeeSchema = z.object({
  employeeId: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .transform((value) => value.toLowerCase()),
  companyName: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .transform((value) => value.toLowerCase()),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().min(6).max(30),
  address: optionalText(500),
  profileImage: z.string().url().or(z.literal('')).optional().default(''),
  gender: z.enum(['male', 'female']).or(z.literal('')).optional().default(''),
  department: optionalText(100),
  designation: z.string().trim().min(2).max(100),
  joiningDate: dateSchema.refine(Boolean),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern']),
  employmentStatus: z.enum(['active', 'inactive', 'on_leave']),
  defaultSiteId: z.string().optional().default(''),
  defaultShiftId: z.string().optional().default(''),
  role: z.enum(['employee', 'hr']),
  basicSalary: z.number().int().nonnegative(),
  salaryAllowances: z.number().int().nonnegative(),
  salaryBonus: z.number().int().nonnegative(),
  salaryTax: z.number().int().nonnegative(),
  salaryProvidentFund: z.number().int().nonnegative(),
  salaryType: z.enum(['monthly', 'hourly']),
  emergencyContactName: optionalText(120),
  emergencyContactPhone: optionalText(30),
  emergencyContactAddress: optionalText(500),
});

const createEmployeeSchema = employeeSchema.extend({ password: z.string().min(8).max(100) });
const updateEmployeeSchema = employeeSchema.extend({
  password: z.string().min(8).max(100).or(z.literal('')).optional().default(''),
});
const employeeStatusSchema = z.object({ isActive: z.boolean() });

async function authorizeHr(c: Context) {
  try {
    const user = await getCurrentUser(getCookie(c, 'workpilot_access') ?? '');
    return user.role === 'hr' ? user : null;
  } catch {
    return null;
  }
}

function currentSalaryPeriod() {
  const today = new Date();
  const month = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(today);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  return { month, period: `1–${lastDay} ${month}` };
}

function userData(input: z.infer<typeof employeeSchema>) {
  return {
    employeeId: input.employeeId,
    companyName: input.companyName,
    fullName: input.fullName,
    email: input.email || null,
    phone: input.phone || null,
    address: input.address || null,
    profileImage: input.profileImage || null,
    gender: input.gender || null,
    department: input.department || null,
    designation: input.designation || null,
    joiningDate: input.joiningDate ? new Date(`${input.joiningDate}T00:00:00.000Z`) : null,
    employmentType: input.employmentType,
    employmentStatus: input.employmentStatus,
    defaultSiteId: input.defaultSiteId || null,
    defaultShiftId: input.defaultShiftId || null,
    role: input.role,
    isActive: input.employmentStatus !== 'inactive',
    basicSalary: input.basicSalary,
    salaryAllowances: input.salaryAllowances,
    salaryBonus: input.salaryBonus,
    salaryTax: input.salaryTax,
    salaryProvidentFund: input.salaryProvidentFund,
    salaryType: input.salaryType,
    emergencyContactName: input.emergencyContactName || null,
    emergencyContactPhone: input.emergencyContactPhone || null,
    emergencyContactAddress: input.emergencyContactAddress || null,
  };
}

async function validWorkplace(siteId: string, shiftId: string) {
  const [site, shift] = await Promise.all([
    siteId ? prisma.site.findUnique({ where: { id: siteId }, select: { id: true } }) : true,
    shiftId ? prisma.shift.findUnique({ where: { id: shiftId }, select: { id: true } }) : true,
  ]);
  return Boolean(site && shift);
}

const employeeInclude = {
  defaultSite: { select: { id: true, name: true } },
  defaultShift: { select: { id: true, name: true, startTime: true, endTime: true } },
};

export const hrEmployeesRoutes = new Hono()
  .get('/', async (c) => {
    const current = await authorizeHr(c);
    if (!current) return c.json({ message: 'Unauthorized.' }, 403);

    const query = getListQuery(c);
    const requestedRole = c.req.query('role');
    const role = requestedRole === 'employee' || requestedRole === 'hr' ? requestedRole : undefined;
    const status =
      query.status === 'active' || query.status === 'inactive' ? query.status : undefined;
    const where: Prisma.UserWhereInput = {
      role: role ?? { in: ['employee', 'hr'] },
      ...(status ? { isActive: status === 'active' } : {}),
      ...(query.search
        ? {
            OR: [
              { employeeId: { contains: query.search, mode: 'insensitive' } },
              { fullName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
              { department: { contains: query.search, mode: 'insensitive' } },
              { designation: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const teamWhere: Prisma.UserWhereInput = { role: { in: ['employee', 'hr'] } };

    const [employees, total, sites, shifts, totalMembers, activeAccounts, employeeCount, payroll] =
      await Promise.all([
        prisma.user.findMany({
          where,
          orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
          skip: query.skip,
          take: query.limit,
          include: employeeInclude,
        }),
        prisma.user.count({ where }),
        prisma.site.findMany({
          orderBy: { name: 'asc' },
          select: { id: true, name: true, isActive: true },
        }),
        prisma.shift.findMany({
          orderBy: { startTime: 'asc' },
          select: { id: true, name: true, startTime: true, endTime: true, isActive: true },
        }),
        prisma.user.count({ where: teamWhere }),
        prisma.user.count({ where: { ...teamWhere, isActive: true } }),
        prisma.user.count({ where: { role: 'employee' } }),
        prisma.user.aggregate({
          where: { ...teamWhere, isActive: true },
          _sum: { basicSalary: true },
        }),
      ]);

    return c.json({
      employees: employees.map(({ passwordHash: _passwordHash, ...employee }) => ({
        ...employee,
        isCurrentUser: employee.id === current.id,
      })),
      sites,
      shifts,
      pagination: pagination(total, query.page, query.limit),
      summary: {
        total: totalMembers,
        active: activeAccounts,
        employees: employeeCount,
        monthlyBasicPayroll: payroll._sum.basicSalary ?? 0,
      },
    });
  })
  .get('/:id', async (c) => {
    const current = await authorizeHr(c);
    if (!current) return c.json({ message: 'Unauthorized.' }, 403);

    const [employee, sites, shifts] = await Promise.all([
      prisma.user.findFirst({
        where: { id: c.req.param('id'), role: { in: ['employee', 'hr'] } },
        include: employeeInclude,
      }),
      prisma.site.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, isActive: true },
      }),
      prisma.shift.findMany({
        orderBy: { startTime: 'asc' },
        select: { id: true, name: true, startTime: true, endTime: true, isActive: true },
      }),
    ]);
    if (!employee) return c.json({ message: 'Employee not found.' }, 404);
    const { passwordHash: _passwordHash, ...safeEmployee } = employee;
    return c.json({
      employee: { ...safeEmployee, isCurrentUser: employee.id === current.id },
      sites,
      shifts,
    });
  })
  .post('/', async (c) => {
    const current = await authorizeHr(c);
    if (!current) return c.json({ message: 'Unauthorized.' }, 403);

    const result = createEmployeeSchema.safeParse(await c.req.json().catch(() => null));
    if (!result.success) return c.json({ message: 'Please provide valid employee details.' }, 400);
    if (!(await validWorkplace(result.data.defaultSiteId, result.data.defaultShiftId))) {
      return c.json({ message: 'Select a valid site and shift.' }, 400);
    }

    const { password, ...input } = result.data;
    const passwordHash = await hash(password, 12);
    const salaryPeriod = currentSalaryPeriod();
    const employee = await prisma
      .$transaction(async (transaction) => {
        const created = await transaction.user.create({
          data: { ...userData(input), passwordHash },
        });
        await transaction.salaryPayment.create({
          data: {
            userId: created.id,
            ...salaryPeriod,
            basic: input.basicSalary,
            allowances: input.salaryAllowances,
            bonus: input.salaryBonus,
            tax: input.salaryTax,
            providentFund: input.salaryProvidentFund,
            status: 'upcoming',
          },
        });
        return transaction.user.findUniqueOrThrow({
          where: { id: created.id },
          include: employeeInclude,
        });
      })
      .catch(() => null);

    if (!employee) {
      return c.json({ message: 'Employee ID or email already exists.' }, 409);
    }
    const { passwordHash: _passwordHash, ...safeEmployee } = employee;
    return c.json({ employee: { ...safeEmployee, isCurrentUser: false } }, 201);
  })
  .patch('/:id/status', async (c) => {
    const current = await authorizeHr(c);
    if (!current) return c.json({ message: 'Unauthorized.' }, 403);

    const result = employeeStatusSchema.safeParse(await c.req.json().catch(() => null));
    if (!result.success) return c.json({ message: 'Select a valid account status.' }, 400);

    const target = await prisma.user.findFirst({
      where: { id: c.req.param('id'), role: { in: ['employee', 'hr'] } },
      select: { id: true },
    });
    if (!target) return c.json({ message: 'Employee not found.' }, 404);
    const employee = await prisma.user.update({
      where: { id: target.id },
      data: {
        isActive: result.data.isActive,
        employmentStatus: result.data.isActive ? 'active' : 'inactive',
      },
      include: employeeInclude,
    });
    const { passwordHash: _passwordHash, ...safeEmployee } = employee;
    return c.json({
      employee: { ...safeEmployee, isCurrentUser: employee.id === current.id },
    });
  })
  .patch('/:id', async (c) => {
    const current = await authorizeHr(c);
    if (!current) return c.json({ message: 'Unauthorized.' }, 403);

    const result = updateEmployeeSchema.safeParse(await c.req.json().catch(() => null));
    if (!result.success) return c.json({ message: 'Please provide valid employee details.' }, 400);
    if (!(await validWorkplace(result.data.defaultSiteId, result.data.defaultShiftId))) {
      return c.json({ message: 'Select a valid site and shift.' }, 400);
    }

    const target = await prisma.user.findFirst({
      where: { id: c.req.param('id'), role: { in: ['employee', 'hr'] } },
      select: { id: true },
    });
    if (!target) return c.json({ message: 'Employee not found.' }, 404);
    if (
      target.id === current.id &&
      (result.data.employmentStatus === 'inactive' || result.data.role !== 'hr')
    ) {
      return c.json({ message: 'You cannot deactivate or change your own HR role.' }, 400);
    }

    const { password, ...input } = result.data;
    const salaryPeriod = currentSalaryPeriod();
    const employee = await prisma
      .$transaction(async (transaction) => {
        await transaction.user.update({
          where: { id: target.id },
          data: {
            ...userData(input),
            ...(password ? { passwordHash: await hash(password, 12) } : {}),
          },
        });
        await transaction.salaryPayment.upsert({
          where: { userId_month: { userId: target.id, month: salaryPeriod.month } },
          update: {
            basic: input.basicSalary,
            allowances: input.salaryAllowances,
            bonus: input.salaryBonus,
            tax: input.salaryTax,
            providentFund: input.salaryProvidentFund,
          },
          create: {
            userId: target.id,
            ...salaryPeriod,
            basic: input.basicSalary,
            allowances: input.salaryAllowances,
            bonus: input.salaryBonus,
            tax: input.salaryTax,
            providentFund: input.salaryProvidentFund,
            status: 'upcoming',
          },
        });
        return transaction.user.findUniqueOrThrow({
          where: { id: target.id },
          include: employeeInclude,
        });
      })
      .catch(() => null);

    if (!employee) {
      return c.json({ message: 'Employee ID or email already exists.' }, 409);
    }
    const { passwordHash: _passwordHash, ...safeEmployee } = employee;
    return c.json({ employee: { ...safeEmployee, isCurrentUser: target.id === current.id } });
  })
  .delete('/:id', async (c) => {
    const current = await authorizeHr(c);
    if (!current) return c.json({ message: 'Unauthorized.' }, 403);

    const target = await prisma.user.findFirst({
      where: { id: c.req.param('id'), role: { in: ['employee', 'hr'] } },
      select: { id: true },
    });
    if (!target) return c.json({ message: 'Employee not found.' }, 404);

    await prisma.user.delete({ where: { id: target.id } });
    return c.json({ message: 'Employee and related records deleted.' });
  });
