'use client';

import { useQuery } from '@tanstack/react-query';
import { EmployeeForm } from '@/components/hr/EmployeeForm';
import { FormPageSkeleton } from '@/components/shared/DataSkeleton';
import { hrEmployeesServer } from '@/server/hr-employees.server';

export default function CreateEmployeePage() {
  const query = useQuery({
    queryKey: ['hr', 'employees', 'create-options'],
    queryFn: () => hrEmployeesServer.list({ page: 1, limit: 1 }),
  });

  if (query.isLoading) {
    return <FormPageSkeleton />;
  }

  return (
    <EmployeeForm mode="create" sites={query.data?.sites ?? []} shifts={query.data?.shifts ?? []} />
  );
}
