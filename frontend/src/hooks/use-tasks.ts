'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksServer } from '@/server/tasks.server';
import type { TaskStatus } from '@/types/task.types';

export function useTasks() {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: ['tasks'] });
  const tasks = useQuery({ queryKey: ['tasks'], queryFn: tasksServer.list });
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      tasksServer.updateStatus(id, status),
    onSuccess: refresh,
  });
  return { tasks, updateStatus };
}
