import { RoleDashboard } from '@/components/dashboard/role-dashboard'

export default function EmployeeDashboardPage() { return <RoleDashboard role="Employee" accent="sky" description="Your work, schedule, and requests in one place." stats={['3 Tasks due', '8h Logged today', '2 Leave days left']} /> }
