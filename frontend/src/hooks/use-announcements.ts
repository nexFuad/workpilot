'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { announcementsServer } from '@/server/announcements.server';
export function useAnnouncements() {
  const queryClient = useQueryClient();
  const announcements = useQuery({
    queryKey: ['announcements'],
    queryFn: announcementsServer.list,
  });
  const markRead = useMutation({
    mutationFn: announcementsServer.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] }),
  });
  return { announcements, markRead };
}
