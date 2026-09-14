export type AnnouncementPriority = 'normal' | 'important' | 'urgent';

export type HrAnnouncement = {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  isPinned: boolean;
  isActive: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type HrAnnouncementInput = Pick<
  HrAnnouncement,
  'title' | 'content' | 'priority' | 'isPinned' | 'isActive'
>;

export type HrAnnouncementPage = {
  announcements: HrAnnouncement[];
  total: number;
  summary: {
    active: number;
    pinned: number;
  };
  nextPage: number | null;
};
