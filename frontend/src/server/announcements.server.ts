import { apiRequest } from './auth.server';
import type { AnnouncementResponse } from '@/types/announcement.types';
export const announcementsServer = {
  list: () => apiRequest<AnnouncementResponse>('/api/announcements'),
  markRead: (id: string) =>
    apiRequest<{ readAt: string }>(`/api/announcements/${id}/read`, { method: 'POST' }),
};
