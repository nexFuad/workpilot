import { RoleDashboard } from '@/components/dashboard/role-dashboard'

export default function HrDashboardPage() { return <RoleDashboard role="HR" accent="emerald" description="People operations, attendance, and leave management." stats={['18 Leave requests', '92% Present today', '3 New employees']} /> }
