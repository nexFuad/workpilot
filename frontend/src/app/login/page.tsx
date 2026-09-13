'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, IdCard, KeyRound } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { roleDashboardPath } from '@/lib/roles';
import type { LoginInput } from '@/types/auth.types';
import { Logo } from '@/components/shared/Logo';

const loginFormSchema = z.object({
  employeeId: z.string().trim().min(1, 'Employee ID is required'),
  companyName: z.string().trim().min(1, 'Company name is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean(),
});

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { employeeId: '', companyName: '', password: '', rememberMe: true },
  });
  useEffect(() => {
    if (user) router.replace(roleDashboardPath[user.role]);
  }, [router, user]);
  const onSubmit = (values: LoginInput) =>
    login.mutate(values, {
      onSuccess: ({ user: signedInUser }) => {
        toast.success(`Welcome back, ${signedInUser.employeeId}!`);
        router.replace(roleDashboardPath[signedInUser.role]);
      },
      onError: (error) => toast.error(error.message || 'Login failed. Please try again.'),
    });
  const fieldClass =
    'mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 pl-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50';
  return (
    <main className="grid min-h-screen place-items-center bg-linear-to-br from-indigo-50 via-white to-sky-50 p-4">
      <section className="w-full max-w-md rounded-3xl border border-white bg-white/90 p-7 shadow-xl shadow-indigo-100/70 sm:p-9">
        <Logo />
        <p className="mt-9 text-sm font-semibold text-indigo-600">WELCOME BACK</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-800">Sign in to WorkPilot</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Use your employee ID, company name, and password to enter your workspace.
        </p>
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
      </section>
    </main>
  );
}
