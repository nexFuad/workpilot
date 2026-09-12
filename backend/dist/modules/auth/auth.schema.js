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
