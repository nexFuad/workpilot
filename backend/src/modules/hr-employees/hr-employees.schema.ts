import { z } from 'zod';

const optionalText = (maximum: number) => z.string().trim().max(maximum).optional().default('');
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .or(z.literal(''));

export const employeeSchema = z.object({
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

export const createEmployeeSchema = employeeSchema.extend({
  password: z.string().min(8).max(100),
});

export const updateEmployeeSchema = employeeSchema.extend({
  password: z.string().min(8).max(100).or(z.literal('')).optional().default(''),
});

export const employeeStatusSchema = z.object({ isActive: z.boolean() });
