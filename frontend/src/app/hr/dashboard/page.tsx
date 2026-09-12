import { RoleGuard } from '@/components/auth/RoleGuard';
import { RoleDashboard } from '@/components/dashboard/RoleDashboard';
export default function HrDashboard() {
  return (
    <RoleGuard role="hr">
      <RoleDashboard
        title="HR Dashboard"
        description="Manage people operations, attendance, and leave requests."
        tone="border-emerald-100 bg-emerald-50"
      />
    </RoleGuard>
  );
}
