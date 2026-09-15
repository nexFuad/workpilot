import { apiRequest } from './auth.server';
import { listQuery } from '@/lib/list-query';
import type { ListParams, PaginationMeta } from '@/types/pagination.types';
export type Site = { id: string; name: string; location: string; isActive: boolean };
export type Shift = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
};
export const hrSettingsServer = {
  sites: (params: ListParams = {}) =>
    apiRequest<{ sites: Site[]; pagination: PaginationMeta }>(`/api/hr/sites${listQuery(params)}`),
  createSite: (data: Omit<Site, 'id'>) =>
    apiRequest('/api/hr/sites', { method: 'POST', body: JSON.stringify(data) }),
  updateSite: (id: string, data: Omit<Site, 'id'>) =>
    apiRequest(`/api/hr/sites/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteSite: (id: string) => apiRequest(`/api/hr/sites/${id}`, { method: 'DELETE' }),
  shifts: (params: ListParams = {}) =>
    apiRequest<{ shifts: Shift[]; pagination: PaginationMeta }>(
      `/api/hr/shifts${listQuery(params)}`,
    ),
  createShift: (data: Omit<Shift, 'id'>) =>
    apiRequest('/api/hr/shifts', { method: 'POST', body: JSON.stringify(data) }),
  updateShift: (id: string, data: Omit<Shift, 'id'>) =>
    apiRequest(`/api/hr/shifts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteShift: (id: string) => apiRequest(`/api/hr/shifts/${id}`, { method: 'DELETE' }),
};
