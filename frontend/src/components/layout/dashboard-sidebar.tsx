import Link from 'next/link'

const links = [['Admin dashboard', '/dashboard/admin'], ['HR dashboard', '/dashboard/hr'], ['Employee dashboard', '/dashboard/employee']]

export function DashboardSidebar() { return <aside className="hidden fixed inset-y-0 left-0 w-64 border-r border-slate-200 bg-white p-6 lg:block"><Link href="/" className="text-xl font-bold text-indigo-700">WorkPilot</Link><p className="mt-10 text-xs font-semibold uppercase tracking-wider text-slate-400">Preview layouts</p><nav className="mt-3 space-y-1">{links.map(([label, href]) => <Link href={href} key={href} className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-700">{label}</Link>)}</nav></aside> }
