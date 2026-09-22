import { apiRequest } from './auth.server';
export type EmployeeDashboard = {
  attendance: { site: string; checkInAt: string } | null;
  pendingLeaves: number;
  salary: { month: string; netSalary: number; status: string } | null;
  loanInstallment: number;
  openTasks: number;
  dueTasks: { id: string; title: string; priority: string; dueDate: string | null }[];
  activeProjects: number;
  pendingDocuments: number;
  announcements: {
    id: string;
    title: string;
    content: string;
    isPinned: boolean;
    publishedAt: string;
  }[];
};

export type HrDashboard = {
  generatedAt: string;
  summary: {
    totalTeamMembers: number;
    activeTeamMembers: number;
    totalEmployees: number;
    activeEmployees: number;
    presentToday: number;
    absentToday: number;
    pendingLeaves: number;
    pendingAdvances: number;
    pendingLoans: number;
    pendingDocuments: number;
    openTasks: number;
    activeProjects: number;
  };
  attendance: {
    date: string;
    rows: {
      employee: {
        id: string;
        employeeId: string;
        fullName: string | null;
        profileImage: string | null;
      };
      status: 'working' | 'completed' | 'absent';
      checkInAt: string | null;
      checkOutAt: string | null;
      site: string | null;
      shift: string | null;
    }[];
  };
  payroll: {
    month: string;
    records: number;
    upcoming: number;
    gross: number;
    deductions: number;
    net: number;
    paid: number;
  } | null;
  pendingRequests: {
    id: string;
    type: string;
    employee: string;
    employeeId: string;
    detail: string;
    amount: number | null;
    createdAt: string;
    href: string;
  }[];
  recentEmployees: {
    id: string;
    employeeId: string;
    fullName: string | null;
    designation: string | null;
    department: string | null;
    profileImage: string | null;
    isActive: boolean;
    createdAt: string;
    defaultSite: { name: string } | null;
  }[];
  tasks: {
    id: string;
    title: string;
    priority: string;
    status: string;
    dueDate: string | null;
    user: { employeeId: string; fullName: string | null };
  }[];
  announcements: {
    id: string;
    title: string;
    content: string;
    priority: string;
    isPinned: boolean;
    publishedAt: string;
  }[];
};

export const dashboardServer = {
  employee: () => apiRequest<EmployeeDashboard>('/api/dashboard/employee'),
  hr: () => apiRequest<HrDashboard>('/api/dashboard/hr'),
};
