export type ProjectStatus = 'planned' | 'active' | 'on_hold' | 'completed';

export type ProjectEmployee = {
  id: string;
  employeeId: string;
  fullName: string | null;
  profileImage?: string | null;
};

export type ProjectAssignment = {
  id: string;
  userId: string;
  projectId: string;
  role: string;
  joinedAt: string;
  user: ProjectEmployee;
};

export type HrProject = {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  progress: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  assignments: ProjectAssignment[];
};

export type HrProjectInput = {
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  startDate: string;
  endDate: string;
  assignments: { userId: string; role: string }[];
};

export type HrProjectsResponse = {
  projects: HrProject[];
  employees: ProjectEmployee[];
  pagination: PaginationMeta;
  summary: { total: number; active: number; completed: number; assignments: number };
};
import type { PaginationMeta } from '@/types/pagination.types';
