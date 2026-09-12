import { RoleDashboard } from '@/components/dashboard/role-dashboard'

export default function AdminDashboardPage() { return <RoleDashboard role="Admin" accent="indigo" description="Organization overview, access control, and operational insights." stats={['128 Employees', '8 Departments', '12 Open requests']} /> }
