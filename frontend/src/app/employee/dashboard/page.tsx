import { RoleGuard } from '@/components/auth/RoleGuard';
import { RoleDashboard } from '@/components/dashboard/RoleDashboard';
export default function EmployeeDashboard() {
  return (
    <RoleGuard role="employee">
      <RoleDashboard
        title="Employee Dashboard"
        description="Stay focused on your work, updates, and requests."
        tone="border-sky-100 bg-sky-50"
      />
    </RoleGuard>
  );
}
