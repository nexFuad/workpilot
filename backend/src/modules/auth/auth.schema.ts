import { z } from 'zod';

export const loginSchema = z.object({
  employeeId: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .transform((value) => value.toLowerCase()),
  companyName: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(200),
  rememberMe: z.boolean().default(false),
});

export const profileSchema = z.object({ fullName: z.string().trim().min(2).max(120), phone: z.string().trim().min(6).max(30), address: z.string().trim().min(3).max(300), profileImage: z.string().url().optional().or(z.literal('')) });
export const passwordSchema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8).max(200) });
