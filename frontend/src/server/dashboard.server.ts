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
export const dashboardServer = {
  employee: () => apiRequest<EmployeeDashboard>('/api/dashboard/employee'),
};
