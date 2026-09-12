import { Logo } from '@/components/shared/Logo';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">
            A simpler, calmer place to manage your people and their work.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Explore</h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-600">
            <a href="#features">Features</a>
            <a href="#roles">For every role</a>
            <a href="#faq">FAQ</a>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Contact</h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-600">
            <a href="mailto:hello@workpilot.com">hello@workpilot.com</a>
            <span>Dhaka, Bangladesh</span>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-100">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          <span>© 2026 WorkPilot. All rights reserved.</span>
          <span>Built for better workdays.</span>
        </div>
      </div>
    </footer>
  );
}
