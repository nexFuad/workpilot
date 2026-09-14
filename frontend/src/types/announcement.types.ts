export type Announcement = {
  id: string;
  title: string;
  content: string;
  priority: 'normal' | 'important' | 'urgent';
  isPinned: boolean;
  publishedAt: string;
  isRead: boolean;
  readAt: string | null;
};

export type AnnouncementResponse = {
  announcements: Announcement[];
  summary: {
    total: number;
    unread: number;
  };
};
