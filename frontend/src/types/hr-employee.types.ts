export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern';
export type EmployeeRole = 'employee' | 'hr';
export type Gender = 'male' | 'female';
export type EmploymentStatus = 'active' | 'inactive' | 'on_leave';
export type SalaryType = 'monthly' | 'hourly';

export type EmployeeSite = { id: string; name: string; isActive?: boolean };
export type EmployeeShift = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  isActive?: boolean;
};

export type HrEmployee = {
  id: string;
  employeeId: string;
  companyName: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  profileImage: string | null;
  gender: Gender | null;
  department: string | null;
  designation: string | null;
  joiningDate: string | null;
  employmentType: EmploymentType | null;
  employmentStatus: EmploymentStatus;
  defaultSiteId: string | null;
  defaultShiftId: string | null;
  basicSalary: number;
  salaryAllowances: number;
  salaryBonus: number;
  salaryTax: number;
  salaryProvidentFund: number;
  salaryType: SalaryType;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactAddress: string | null;
  role: EmployeeRole;
  isActive: boolean;
  isCurrentUser: boolean;
  createdAt: string;
  updatedAt: string;
  defaultSite: Pick<EmployeeSite, 'id' | 'name'> | null;
  defaultShift: Omit<EmployeeShift, 'isActive'> | null;
};

export type HrEmployeeInput = {
  employeeId: string;
  companyName: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  profileImage: string;
  gender: Gender | '';
  department: string;
  designation: string;
  joiningDate: string;
  employmentType: EmploymentType;
  employmentStatus: EmploymentStatus;
  defaultSiteId: string;
  defaultShiftId: string;
  role: EmployeeRole;
  basicSalary: number;
  salaryAllowances: number;
  salaryBonus: number;
  salaryTax: number;
  salaryProvidentFund: number;
  salaryType: SalaryType;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactAddress: string;
  password: string;
};

export type HrEmployeesResponse = {
  employees: HrEmployee[];
  sites: EmployeeSite[];
  shifts: EmployeeShift[];
  pagination: PaginationMeta;
  summary: {
    total: number;
    active: number;
    employees: number;
    monthlyBasicPayroll: number;
  };
};

export type HrEmployeeDetailsResponse = Omit<HrEmployeesResponse, 'employees'> & {
  employee: HrEmployee;
};
import type { PaginationMeta } from '@/types/pagination.types';
