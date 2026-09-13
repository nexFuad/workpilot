import { EmployeeHeader } from '@/components/employee/EmployeeHeader';
import { ProfileSettings } from '@/components/shared/ProfileSettings';
export default function AccountPage() {
  return (
    <section className="w-full space-y-6 pb-8">
      <EmployeeHeader
        title="My Account"
        description="Manage your personal profile and account settings."
      />
      <ProfileSettings />
    </section>
  );
}
