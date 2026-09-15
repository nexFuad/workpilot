import { apiRequest } from '@/server/auth.server';
import type {
  HrAnnouncement,
  HrAnnouncementInput,
  HrAnnouncementPage,
} from '@/types/hr-announcement.types';

export const hrAnnouncementsServer = {
  list: (page: number, limit = 6, search = '') => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    return apiRequest<HrAnnouncementPage>(`/api/hr/announcements?${params.toString()}`);
  },
  create: (input: HrAnnouncementInput) =>
    apiRequest<{ announcement: HrAnnouncement }>('/api/hr/announcements', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  update: (id: string, input: HrAnnouncementInput) =>
    apiRequest<{ announcement: HrAnnouncement }>(`/api/hr/announcements/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  remove: (id: string) =>
    apiRequest<{ message: string }>(`/api/hr/announcements/${id}`, { method: 'DELETE' }),
};
