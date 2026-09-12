import Link from 'next/link'

export function DashboardHeader() { return <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 md:px-8"><Link href="/" className="font-bold text-indigo-700 lg:hidden">WorkPilot</Link><p className="hidden text-sm text-slate-500 lg:block">Dashboard preview</p><Link href="/login" className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600">Sign out</Link></header> }
