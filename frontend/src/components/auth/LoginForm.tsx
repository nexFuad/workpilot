'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, IdCard, KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { roleDashboardPath } from '@/lib/roles';
import type { LoginInput } from '@/types/auth.types';

const loginFormSchema = z.object({
  employeeId: z.string().trim().min(1, 'Employee ID is required'),
  companyName: z.string().trim().min(1, 'Company name is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean(),
});

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { employeeId: '', companyName: '', password: '', rememberMe: true },
  });
  const onSubmit = (values: LoginInput) =>
    login.mutate(values, {
      onSuccess: ({ user }) => {
        toast.success(`Welcome back, ${user.employeeId}!`);
        router.replace(roleDashboardPath[user.role]);
      },
      onError: (error) => toast.error(error.message || 'Login failed. Please try again.'),
    });
  const fieldClass =
    'mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 pl-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50';
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4">
      <label className="block text-sm font-medium text-slate-700">
        Employee ID
        <span className="relative block">
          <IdCard className="absolute left-3 top-4 size-4 text-slate-400" />
          <input
            {...register('employeeId')}
            className={fieldClass}
            placeholder="e.g. nexstack1"
            autoComplete="username"
          />
        </span>
        {errors.employeeId && (
          <span className="mt-1 block text-xs text-rose-600">{errors.employeeId.message}</span>
        )}
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Company name
        <span className="relative block">
          <Building2 className="absolute left-3 top-4 size-4 text-slate-400" />
          <input
            {...register('companyName')}
            className={fieldClass}
            placeholder="e.g. nexstack1"
            autoComplete="organization"
          />
        </span>
        {errors.companyName && (
          <span className="mt-1 block text-xs text-rose-600">{errors.companyName.message}</span>
        )}
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Password
        <span className="relative block">
          <KeyRound className="absolute left-3 top-4 size-4 text-slate-400" />
          <input
            {...register('password')}
            className={fieldClass}
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
          />
        </span>
        {errors.password && (
          <span className="mt-1 block text-xs text-rose-600">{errors.password.message}</span>
        )}
      </label>
      <label className="flex cursor-pointer items-center gap-2 pt-1 text-sm text-slate-600">
        <input
          {...register('rememberMe')}
          type="checkbox"
          className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        Remember me on this device
      </label>
      <button
        disabled={login.isPending}
        className="w-full rounded-xl bg-indigo-100 py-3 font-semibold text-indigo-700 transition hover:bg-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {login.isPending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
