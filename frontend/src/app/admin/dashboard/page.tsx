import { RoleGuard } from '@/components/auth/RoleGuard';
import { RoleDashboard } from '@/components/dashboard/RoleDashboard';
export default function AdminDashboard() {
  return (
    <RoleGuard role="admin">
      <RoleDashboard
        title="Admin Dashboard"
        description="Monitor your organization, people, and office operations."
        tone="border-indigo-100 bg-indigo-50"
      />
    </RoleGuard>
  );
}
