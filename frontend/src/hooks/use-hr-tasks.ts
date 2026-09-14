'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hrTasksServer } from '@/server/hr-tasks.server';
import type { HrTaskInput } from '@/types/hr-task.types';

export function useHrTasks() {
  const queryClient = useQueryClient();
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['hr', 'tasks'] }),
      queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    ]);
  };

  const tasks = useQuery({ queryKey: ['hr', 'tasks'], queryFn: hrTasksServer.list });
  const create = useMutation({ mutationFn: hrTasksServer.create, onSuccess: refresh });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: HrTaskInput }) =>
      hrTasksServer.update(id, input),
    onSuccess: refresh,
  });
  const remove = useMutation({ mutationFn: hrTasksServer.remove, onSuccess: refresh });

  return { tasks, create, update, remove };
}
