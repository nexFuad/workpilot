import { apiRequest } from './auth.server';
import type { AnnouncementResponse } from '@/types/announcement.types';
export const announcementsServer = {
  list: (search = '') => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiRequest<AnnouncementResponse>(`/api/announcements${query}`);
  },
  markRead: (id: string) =>
    apiRequest<{ readAt: string }>(`/api/announcements/${id}/read`, { method: 'POST' }),
};
