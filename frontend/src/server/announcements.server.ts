import { apiRequest } from './auth.server';
import type { Announcement } from '@/types/announcement.types';
export const announcementsServer = {
  list: () => apiRequest<{ announcements: Announcement[] }>('/api/announcements'),
};
