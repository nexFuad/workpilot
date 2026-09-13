export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type EmployeeTask = {
  id: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high';
  status: TaskStatus;
  dueDate: string | null;
  createdAt: string;
};
