import type { ReactNode } from 'react'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-slate-50"><DashboardSidebar /><div className="lg:pl-64"><DashboardHeader /><main className="p-5 md:p-8">{children}</main></div></div>
}
