import type { TaskStatus } from '@/types/task.types';

export type TaskPriority = 'low' | 'medium' | 'high';

export type HrTaskEmployee = {
  id: string;
  employeeId: string;
  fullName: string | null;
  profileImage?: string | null;
};

export type HrTask = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  user: HrTaskEmployee;
};

export type HrTaskInput = {
  userId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
};

export type HrTasksResponse = {
  tasks: HrTask[];
  employees: HrTaskEmployee[];
};
