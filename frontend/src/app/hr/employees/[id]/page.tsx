'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { EmployeeForm } from '@/components/hr/EmployeeForm';
import { FormPageSkeleton } from '@/components/shared/DataSkeleton';
import { hrEmployeesServer } from '@/server/hr-employees.server';

export default function EditEmployeePage() {
  const { id } = useParams<{ id: string }>();
  const query = useQuery({
    queryKey: ['hr', 'employees', id],
    queryFn: () => hrEmployeesServer.get(id),
    enabled: Boolean(id),
  });

  if (query.isLoading) {
    return <FormPageSkeleton />;
  }

  if (query.isError || !query.data?.employee) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-10 text-center">
        <p className="font-bold text-rose-700">Employee information could not be loaded.</p>
        <Link
          href="/hr/employees"
          className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-rose-700 underline underline-offset-4"
        >
          <ArrowLeft className="size-4" /> Back to employees
        </Link>
      </div>
    );
  }

  return (
    <EmployeeForm
      mode="edit"
      employee={query.data.employee}
      sites={query.data.sites}
      shifts={query.data.shifts}
    />
  );
}
