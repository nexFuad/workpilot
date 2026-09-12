'use client';

import { Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Logo } from '@/components/shared/Logo';

const links = [
  { label: 'Home', id: 'home' },
  { label: 'Features', id: 'features' },
  { label: 'How it works', id: 'how-it-works' },
  { label: 'Roles', id: 'roles' },
  { label: 'Resources', id: 'resources' },
  { label: 'FAQ', id: 'faq' },
];

export function Navbar() {
  const [activeId, setActiveId] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const sections = links
      .map(({ id }) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-28% 0px -62% 0px', threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function closeOnOutsideClick(event: PointerEvent) {
      const target = event.target as Node;
      if (drawerRef.current?.contains(target) || menuButtonRef.current?.contains(target)) return;
      setMenuOpen(false);
    }
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [menuOpen]);

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setActiveId(id);
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <div className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollToSection(link.id)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeId === link.id
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>
        <a
          href="/login"
          className="hidden rounded-lg bg-indigo-100 px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-200 lg:inline-flex"
        >
          Sign in
        </a>
        <button
          ref={menuButtonRef}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
        >
          {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </nav>
      {menuOpen && (
        <div className="lg:hidden">
          <button
            aria-label="Close navigation menu"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-slate-900/10 backdrop-blur-[1px]"
          />
          <aside
            ref={drawerRef}
            className="fixed left-3 top-20 z-50 h-fit w-[min(18rem,calc(100vw-1.5rem))] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-300/40"
          >
            <div className="mb-2 flex items-center justify-between px-2 pt-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Navigate
              </span>
              <button
                aria-label="Close navigation menu"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="grid gap-1">
              {links.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className={`rounded-lg px-3 py-2.5 text-left text-sm font-medium ${
                    activeId === link.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
                  }`}
                >
                  {link.label}
                </button>
              ))}
              <a
                href="/login"
                className="mt-2 rounded-lg bg-indigo-100 px-3 py-2.5 text-center text-sm font-semibold text-indigo-700"
              >
                Sign in
              </a>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
