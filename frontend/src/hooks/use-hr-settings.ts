'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hrSettingsServer, type Shift, type Site } from '@/server/hr-settings.server';
export function useSites() {
  const c = useQueryClient();
  const refresh = () => c.invalidateQueries({ queryKey: ['hr', 'sites'] });
  return {
    sites: useQuery({ queryKey: ['hr', 'sites'], queryFn: hrSettingsServer.sites }),
    create: useMutation({
      mutationFn: (x: Omit<Site, 'id'>) => hrSettingsServer.createSite(x),
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: ({ id, data }: { id: string; data: Omit<Site, 'id'> }) =>
        hrSettingsServer.updateSite(id, data),
      onSuccess: refresh,
    }),
    remove: useMutation({ mutationFn: hrSettingsServer.deleteSite, onSuccess: refresh }),
  };
}
export function useShifts() {
  const c = useQueryClient();
  const refresh = () => c.invalidateQueries({ queryKey: ['hr', 'shifts'] });
  return {
    shifts: useQuery({ queryKey: ['hr', 'shifts'], queryFn: hrSettingsServer.shifts }),
    create: useMutation({
      mutationFn: (x: Omit<Shift, 'id'>) => hrSettingsServer.createShift(x),
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: ({ id, data }: { id: string; data: Omit<Shift, 'id'> }) =>
        hrSettingsServer.updateShift(id, data),
      onSuccess: refresh,
    }),
    remove: useMutation({ mutationFn: hrSettingsServer.deleteShift, onSuccess: refresh }),
  };
}
