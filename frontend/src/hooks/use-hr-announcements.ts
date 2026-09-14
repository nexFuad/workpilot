import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hrAnnouncementsServer } from '@/server/hr-announcements.server';
import type { HrAnnouncementInput } from '@/types/hr-announcement.types';

const queryKey = ['hr', 'announcements'] as const;

export function useHrAnnouncements() {
  const queryClient = useQueryClient();
  const announcements = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => hrAnnouncementsServer.list(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey });

  const create = useMutation({
    mutationFn: hrAnnouncementsServer.create,
    onSuccess: refresh,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: HrAnnouncementInput }) =>
      hrAnnouncementsServer.update(id, input),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: hrAnnouncementsServer.remove,
    onSuccess: refresh,
  });

  return { announcements, create, update, remove };
}
