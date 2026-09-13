'use client';
import { useQuery } from '@tanstack/react-query';
import { projectsServer } from '@/server/projects.server';
export function useProjects() {
  return useQuery({ queryKey: ['projects'], queryFn: projectsServer.list });
}
