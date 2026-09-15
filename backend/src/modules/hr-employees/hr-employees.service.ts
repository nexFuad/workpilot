import type { Prisma } from '@prisma/client';
import { hash } from 'bcryptjs';
import type { z } from 'zod';
import { ApiError } from '../../lib/api-error.js';
import { monthLabel } from '../../lib/date.js';
import { pagination, type ListQuery } from '../../lib/list-query.js';
import { prisma } from '../../lib/prisma.js';
import { isPrismaError } from '../../lib/prisma-error.js';
import {
  createEmployeeSchema,
  employeeSchema,
  updateEmployeeSchema,
} from './hr-employees.schema.js';

type EmployeeInput = z.infer<typeof employeeSchema>;
type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

const employeeInclude = {
  defaultSite: { select: { id: true, name: true } },
  defaultShift: { select: { id: true, name: true, startTime: true, endTime: true } },
} as const;

function salaryPeriod() {
  const today = new Date();
  const month = monthLabel(today);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  return { month, period: `1–${lastDay} ${month}` };
}

function userData(input: EmployeeInput) {
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

function safeEmployee<T extends { id: string; passwordHash: string }>(
  employee: T,
  currentUserId: string,
) {
  const { passwordHash: _passwordHash, ...safe } = employee;
  return { ...safe, isCurrentUser: employee.id === currentUserId };
}

async function ensureValidWorkplace(siteId: string, shiftId: string) {
  const [site, shift] = await Promise.all([
    siteId ? prisma.site.findUnique({ where: { id: siteId }, select: { id: true } }) : true,
    shiftId ? prisma.shift.findUnique({ where: { id: shiftId }, select: { id: true } }) : true,
  ]);
  if (!site || !shift) throw new ApiError(400, 'Select a valid site and shift.');
}

async function findTeamMember(id: string) {
  const user = await prisma.user.findFirst({
    where: { id, role: { in: ['employee', 'hr'] } },
    select: { id: true },
  });
  if (!user) throw new ApiError(404, 'Employee not found.');
  return user;
}

export async function listEmployees(
  currentUserId: string,
  query: ListQuery,
  requestedRole?: string,
) {
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
  return {
    employees: employees.map((employee) => safeEmployee(employee, currentUserId)),
    sites,
    shifts,
    pagination: pagination(total, query.page, query.limit),
    summary: {
      total: totalMembers,
      active: activeAccounts,
      employees: employeeCount,
      monthlyBasicPayroll: payroll._sum.basicSalary ?? 0,
    },
  };
}

export async function getEmployee(id: string, currentUserId: string) {
  const [employee, sites, shifts] = await Promise.all([
    prisma.user.findFirst({
      where: { id, role: { in: ['employee', 'hr'] } },
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
  if (!employee) throw new ApiError(404, 'Employee not found.');
  return { employee: safeEmployee(employee, currentUserId), sites, shifts };
}

export async function createEmployee(input: CreateEmployeeInput, currentUserId: string) {
  await ensureValidWorkplace(input.defaultSiteId, input.defaultShiftId);
  const { password, ...employeeInput } = input;
  const period = salaryPeriod();
  try {
    const employee = await prisma.$transaction(async (transaction) => {
      const created = await transaction.user.create({
        data: { ...userData(employeeInput), passwordHash: await hash(password, 12) },
      });
      await transaction.salaryPayment.create({
        data: {
          userId: created.id,
          ...period,
          basic: employeeInput.basicSalary,
          allowances: employeeInput.salaryAllowances,
          bonus: employeeInput.salaryBonus,
          tax: employeeInput.salaryTax,
          providentFund: employeeInput.salaryProvidentFund,
          status: 'upcoming',
        },
      });
      return transaction.user.findUniqueOrThrow({
        where: { id: created.id },
        include: employeeInclude,
      });
    });
    return safeEmployee(employee, currentUserId);
  } catch (error) {
    if (isPrismaError(error, 'P2002')) {
      throw new ApiError(409, 'Employee ID or email already exists.');
    }
    throw error;
  }
}

export async function updateEmployeeStatus(id: string, isActive: boolean, currentUserId: string) {
  const target = await findTeamMember(id);
  const employee = await prisma.user.update({
    where: { id: target.id },
    data: {
      isActive,
      employmentStatus: isActive ? 'active' : 'inactive',
    },
    include: employeeInclude,
  });
  return safeEmployee(employee, currentUserId);
}

export async function updateEmployee(
  id: string,
  input: UpdateEmployeeInput,
  currentUserId: string,
) {
  await ensureValidWorkplace(input.defaultSiteId, input.defaultShiftId);
  const target = await findTeamMember(id);
  if (
    target.id === currentUserId &&
    (input.employmentStatus === 'inactive' || input.role !== 'hr')
  ) {
    throw new ApiError(400, 'You cannot deactivate or change your own HR role.');
  }
  const { password, ...employeeInput } = input;
  const period = salaryPeriod();
  try {
    const employee = await prisma.$transaction(async (transaction) => {
      await transaction.user.update({
        where: { id: target.id },
        data: {
          ...userData(employeeInput),
          ...(password ? { passwordHash: await hash(password, 12) } : {}),
        },
      });
      await transaction.salaryPayment.upsert({
        where: { userId_month: { userId: target.id, month: period.month } },
        update: {
          basic: employeeInput.basicSalary,
          allowances: employeeInput.salaryAllowances,
          bonus: employeeInput.salaryBonus,
          tax: employeeInput.salaryTax,
          providentFund: employeeInput.salaryProvidentFund,
        },
        create: {
          userId: target.id,
          ...period,
          basic: employeeInput.basicSalary,
          allowances: employeeInput.salaryAllowances,
          bonus: employeeInput.salaryBonus,
          tax: employeeInput.salaryTax,
          providentFund: employeeInput.salaryProvidentFund,
          status: 'upcoming',
        },
      });
      return transaction.user.findUniqueOrThrow({
        where: { id: target.id },
        include: employeeInclude,
      });
    });
    return safeEmployee(employee, currentUserId);
  } catch (error) {
    if (isPrismaError(error, 'P2002')) {
      throw new ApiError(409, 'Employee ID or email already exists.');
    }
    throw error;
  }
}

export async function deleteEmployee(id: string) {
  const target = await findTeamMember(id);
  await prisma.user.delete({ where: { id: target.id } });
}
