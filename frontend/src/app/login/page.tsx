import { AuthRedirect } from '@/components/auth/AuthRedirect';
import { LoginForm } from '@/components/auth/LoginForm';
import { Logo } from '@/components/shared/Logo';

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-4">
      <AuthRedirect />
      <section className="w-full max-w-md rounded-3xl border border-white bg-white/90 p-7 shadow-xl shadow-indigo-100/70 sm:p-9">
        <Logo />
        <p className="mt-9 text-sm font-semibold text-indigo-600">WELCOME BACK</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-800">Sign in to WorkPilot</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Use your employee ID, company name, and password to enter your workspace.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
