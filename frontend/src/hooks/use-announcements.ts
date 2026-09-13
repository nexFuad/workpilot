'use client';
import { useQuery } from '@tanstack/react-query';
import { announcementsServer } from '@/server/announcements.server';
export function useAnnouncements() {
  return useQuery({ queryKey: ['announcements'], queryFn: announcementsServer.list });
}
