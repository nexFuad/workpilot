'use client';

import {
  ArrowLeft,
  BadgeDollarSign,
  BriefcaseBusiness,
  Camera,
  ContactRound,
  LoaderCircle,
  LockKeyhole,
  Save,
  UserRound,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { SoftSelect } from '@/components/ui/SoftSelect';
import { useAuth } from '@/hooks/use-auth';
import { useCloudinaryUpload } from '@/hooks/use-cloudinary-upload';
import { hrEmployeesServer } from '@/server/hr-employees.server';
import type {
  EmployeeRole,
  EmployeeShift,
  EmployeeSite,
  EmploymentStatus,
  EmploymentType,
  Gender,
  HrEmployee,
  HrEmployeeInput,
  SalaryType,
} from '@/types/hr-employee.types';

const emptyForm: HrEmployeeInput = {
  employeeId: '',
  companyName: '',
  fullName: '',
  email: '',
  phone: '',
  address: '',
  profileImage: '',
  gender: '',
  department: '',
  designation: '',
  joiningDate: '',
  employmentType: 'full_time',
  employmentStatus: 'active',
  defaultSiteId: '',
  defaultShiftId: '',
  role: 'employee',
  basicSalary: 0,
  salaryAllowances: 0,
  salaryBonus: 0,
  salaryTax: 0,
  salaryProvidentFund: 0,
  salaryType: 'monthly',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactAddress: '',
  password: '',
};

const fieldClass =
  'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60';

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function initialForm(employee?: HrEmployee, companyName = ''): HrEmployeeInput {
  if (!employee) return { ...emptyForm, companyName };
  return {
    employeeId: employee.employeeId,
    companyName: employee.companyName,
    fullName: employee.fullName ?? '',
    email: employee.email ?? '',
    phone: employee.phone ?? '',
    address: employee.address ?? '',
    profileImage: employee.profileImage ?? '',
    gender: employee.gender ?? '',
    department: employee.department ?? '',
    designation: employee.designation ?? '',
    joiningDate: employee.joiningDate?.slice(0, 10) ?? '',
    employmentType: employee.employmentType ?? 'full_time',
    employmentStatus: employee.employmentStatus,
    defaultSiteId: employee.defaultSiteId ?? '',
    defaultShiftId: employee.defaultShiftId ?? '',
    role: employee.role,
    basicSalary: employee.basicSalary,
    salaryAllowances: employee.salaryAllowances,
    salaryBonus: employee.salaryBonus,
    salaryTax: employee.salaryTax,
    salaryProvidentFund: employee.salaryProvidentFund,
    salaryType: employee.salaryType,
    emergencyContactName: employee.emergencyContactName ?? '',
    emergencyContactPhone: employee.emergencyContactPhone ?? '',
    emergencyContactAddress: employee.emergencyContactAddress ?? '',
    password: '',
  };
}

function SectionTitle({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof UserRound;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
        <Icon className="size-4.5" />
      </span>
      <div>
        <h2 className="font-bold text-slate-800">{title}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
}

export function EmployeeForm({
  mode,
  employee,
  sites,
  shifts,
}: {
  mode: 'create' | 'edit';
  employee?: HrEmployee;
  sites: EmployeeSite[];
  shifts: EmployeeShift[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading } = useCloudinaryUpload();
  const [form, setForm] = useState<HrEmployeeInput>(() => initialForm(employee, user?.companyName));
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const uploadPhoto = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Choose an image file.');
    if (file.size > 5 * 1024 * 1024) return toast.error('Profile photo must be under 5 MB.');
    try {
      const profileImage = await uploadFile(file, 'workpilot/profiles');
      setForm((current) => ({ ...current, profileImage }));
      toast.success('Profile photo uploaded.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Photo upload failed.');
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === 'create' && form.password.length < 8) {
      return toast.error('Password must contain at least 8 characters.');
    }
    if (form.password !== confirmPassword) {
      return toast.error('Password and confirm password do not match.');
    }
    setIsSaving(true);
    try {
      if (mode === 'edit' && employee) {
        await hrEmployeesServer.update(employee.id, form);
        toast.success('Employee information updated.');
      } else {
        await hrEmployeesServer.create(form);
        toast.success('Employee account created.');
      }
      await queryClient.invalidateQueries({ queryKey: ['hr', 'employees'] });
      router.push('/hr/employees');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Employee could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  const grossSalary = form.basicSalary + form.salaryAllowances + form.salaryBonus;
  const takeHome = grossSalary - form.salaryTax - form.salaryProvidentFund;

  return (
    <section className="w-full space-y-6 pb-24">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Link
            href="/hr/employees"
            className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 hover:text-emerald-800"
          >
            <ArrowLeft className="size-4" /> Back to employees
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-slate-800">
            {mode === 'create' ? 'Create employee' : 'Edit employee'}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {mode === 'create'
              ? 'Create the employee profile, salary configuration and login account.'
              : 'Update employee, employment, salary and account information.'}
          </p>
        </div>
        <span className="w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
          {mode === 'create' ? 'New employee' : employee?.employeeId}
        </span>
      </header>

      <form onSubmit={save} className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionTitle
            icon={UserRound}
            title="Basic information"
            description="Personal and contact details used across the workspace."
          />
          <div className="mt-5 grid gap-5 lg:grid-cols-[180px_1fr]">
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
              <div className="mx-auto grid size-28 place-items-center overflow-hidden rounded-2xl bg-emerald-100 text-emerald-700">
                {form.profileImage ? (
                  <Image
                    src={form.profileImage}
                    alt="Employee profile"
                    width={112}
                    height={112}
                    className="size-full object-cover"
                  />
                ) : (
                  <UserRound className="size-10" />
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => void uploadPhoto(event.target.files?.[0])}
              />
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileRef.current?.click()}
                className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 text-xs font-bold text-emerald-700 disabled:opacity-60"
              >
                {isUploading ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Camera className="size-4" />
                )}
                {isUploading ? 'Uploading...' : 'Upload photo'}
              </button>
              <p className="mt-2 text-[11px] text-slate-400">JPG, PNG or WebP · Max 5 MB</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm font-bold text-slate-700">
                Employee name <span className="text-rose-500">*</span>
                <input
                  required
                  minLength={2}
                  maxLength={120}
                  value={form.fullName}
                  onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                  placeholder="Full name"
                  className={fieldClass}
                />
              </label>
              <label className="text-sm font-bold text-slate-700">
                Employee ID <span className="text-rose-500">*</span>
                <input
                  required
                  minLength={2}
                  maxLength={60}
                  value={form.employeeId}
                  onChange={(event) => setForm({ ...form, employeeId: event.target.value })}
                  placeholder="EMP-001"
                  className={fieldClass}
                />
              </label>
              <label className="text-sm font-bold text-slate-700">
                Email <span className="text-rose-500">*</span>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="employee@company.com"
                  className={fieldClass}
                />
              </label>
              <label className="text-sm font-bold text-slate-700">
                Phone number <span className="text-rose-500">*</span>
                <input
                  required
                  minLength={6}
                  maxLength={30}
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  placeholder="+880 1XXXXXXXXX"
                  className={fieldClass}
                />
              </label>
              <label className="text-sm font-bold text-slate-700 sm:col-span-2">
                Gender
                <SoftSelect
                  value={form.gender || undefined}
                  onValueChange={(value) => setForm({ ...form, gender: value as Gender })}
                  placeholder="Select gender"
                  tone="emerald"
                  options={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                  ]}
                />
              </label>
              <label className="text-sm font-bold text-slate-700 sm:col-span-2 lg:col-span-3">
                Address
                <textarea
                  rows={3}
                  maxLength={500}
                  value={form.address}
                  onChange={(event) => setForm({ ...form, address: event.target.value })}
                  placeholder="Residential address"
                  className={`${fieldClass} resize-none`}
                />
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionTitle
            icon={BriefcaseBusiness}
            title="Employment information"
            description="Job, workplace, joining and employment status details."
          />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-bold text-slate-700">
              Designation / job title <span className="text-rose-500">*</span>
              <input
                required
                minLength={2}
                maxLength={100}
                value={form.designation}
                onChange={(event) => setForm({ ...form, designation: event.target.value })}
                placeholder="e.g. Software Engineer"
                className={fieldClass}
              />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Department
              <input
                maxLength={100}
                value={form.department}
                onChange={(event) => setForm({ ...form, department: event.target.value })}
                placeholder="e.g. Engineering"
                className={fieldClass}
              />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Employee type
              <SoftSelect
                value={form.employmentType}
                onValueChange={(value) =>
                  setForm({ ...form, employmentType: value as EmploymentType })
                }
                placeholder="Select employee type"
                tone="emerald"
                options={[
                  { value: 'full_time', label: 'Full-time' },
                  { value: 'part_time', label: 'Part-time' },
                  { value: 'contract', label: 'Contract' },
                  { value: 'intern', label: 'Intern' },
                ]}
              />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Join date <span className="text-rose-500">*</span>
              <input
                required
                type="date"
                value={form.joiningDate}
                onChange={(event) => setForm({ ...form, joiningDate: event.target.value })}
                className={fieldClass}
              />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Employment status
              <SoftSelect
                value={form.employmentStatus}
                onValueChange={(value) =>
                  setForm({ ...form, employmentStatus: value as EmploymentStatus })
                }
                placeholder="Select employment status"
                tone="emerald"
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'on_leave', label: 'On leave' },
                ]}
              />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Site
              <SoftSelect
                value={form.defaultSiteId || 'none'}
                onValueChange={(value) =>
                  setForm({ ...form, defaultSiteId: value === 'none' ? '' : value })
                }
                placeholder="Select site"
                tone="emerald"
                options={[
                  { value: 'none', label: 'No assigned site' },
                  ...sites.map((site) => ({
                    value: site.id,
                    label: `${site.name}${site.isActive ? '' : ' (Inactive)'}`,
                  })),
                ]}
              />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Shift
              <SoftSelect
                value={form.defaultShiftId || 'none'}
                onValueChange={(value) =>
                  setForm({ ...form, defaultShiftId: value === 'none' ? '' : value })
                }
                placeholder="Select shift"
                tone="emerald"
                options={[
                  { value: 'none', label: 'No assigned shift' },
                  ...shifts.map((shift) => ({
                    value: shift.id,
                    label: `${shift.name} · ${shift.startTime}–${shift.endTime}${shift.isActive ? '' : ' (Inactive)'}`,
                  })),
                ]}
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionTitle
            icon={BadgeDollarSign}
            title="Salary information"
            description="Recurring earnings and deductions used during payroll generation."
          />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-bold text-slate-700">
              Basic salary <span className="text-rose-500">*</span>
              <input
                required
                type="number"
                min="0"
                step="1"
                value={form.basicSalary}
                onChange={(event) =>
                  setForm({ ...form, basicSalary: Math.max(0, Number(event.target.value)) })
                }
                className={fieldClass}
              />
            </label>
            {(
              [
                ['salaryAllowances', 'Allowance'],
                ['salaryBonus', 'Bonus'],
                ['salaryTax', 'Tax deduction'],
                ['salaryProvidentFund', 'Provident fund'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="text-sm font-bold text-slate-700">
                {label}
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form[key]}
                  onChange={(event) =>
                    setForm({ ...form, [key]: Math.max(0, Number(event.target.value)) })
                  }
                  className={fieldClass}
                />
              </label>
            ))}
            <label className="text-sm font-bold text-slate-700">
              Salary type
              <SoftSelect
                value={form.salaryType}
                onValueChange={(value) => setForm({ ...form, salaryType: value as SalaryType })}
                placeholder="Select salary type"
                tone="emerald"
                options={[
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'hourly', label: 'Hourly' },
                ]}
              />
            </label>
          </div>
          <div className="mt-5 grid gap-3 rounded-2xl bg-emerald-50 p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                Gross earnings
              </p>
              <p className="mt-1 text-xl font-bold text-emerald-800">{money.format(grossSalary)}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                Expected take-home
              </p>
              <p className="mt-1 text-xl font-bold text-emerald-800">{money.format(takeHome)}</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionTitle
            icon={LockKeyhole}
            title="Account information"
            description="Login credentials, access role and account availability."
          />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-bold text-slate-700">
              Company name <span className="text-rose-500">*</span>
              <input
                required
                minLength={1}
                maxLength={100}
                value={form.companyName}
                onChange={(event) => setForm({ ...form, companyName: event.target.value })}
                placeholder="Company name used for login"
                autoComplete="organization"
                className={fieldClass}
              />
            </label>
            <label className="text-sm font-bold text-slate-700">
              {mode === 'create' ? 'Password' : 'New password'}{' '}
              {mode === 'create' && <span className="text-rose-500">*</span>}
              <input
                type="password"
                required={mode === 'create'}
                minLength={8}
                maxLength={100}
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder={mode === 'create' ? 'Minimum 8 characters' : 'Leave blank to keep it'}
                className={fieldClass}
              />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Confirm password {mode === 'create' && <span className="text-rose-500">*</span>}
              <input
                type="password"
                required={mode === 'create'}
                minLength={mode === 'create' ? 8 : undefined}
                maxLength={100}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Enter the password again"
                className={fieldClass}
              />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Role
              <SoftSelect
                value={form.role}
                onValueChange={(value) => setForm({ ...form, role: value as EmployeeRole })}
                placeholder="Select role"
                tone="emerald"
                disabled={Boolean(employee?.isCurrentUser)}
                options={[
                  { value: 'employee', label: 'Employee' },
                  { value: 'hr', label: 'HR' },
                ]}
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionTitle
            icon={ContactRound}
            title="Additional information"
            description="Emergency contact details for urgent situations."
          />
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <label className="text-sm font-bold text-slate-700">
              Emergency contact name
              <input
                maxLength={120}
                value={form.emergencyContactName}
                onChange={(event) => setForm({ ...form, emergencyContactName: event.target.value })}
                placeholder="Contact person name"
                className={fieldClass}
              />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Emergency contact phone
              <input
                maxLength={30}
                value={form.emergencyContactPhone}
                onChange={(event) =>
                  setForm({ ...form, emergencyContactPhone: event.target.value })
                }
                placeholder="Emergency phone number"
                className={fieldClass}
              />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Emergency contact address
              <input
                maxLength={500}
                value={form.emergencyContactAddress}
                onChange={(event) =>
                  setForm({ ...form, emergencyContactAddress: event.target.value })
                }
                placeholder="Emergency contact address"
                className={fieldClass}
              />
            </label>
          </div>
        </section>

        <div className="sticky bottom-4 z-20 flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:justify-end">
          <Link
            href="/hr/employees"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving || isUploading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {mode === 'create' ? 'Create employee' : 'Save changes'}
          </button>
        </div>
      </form>
    </section>
  );
}
