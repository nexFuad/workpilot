export type Announcement = {
  id: string;
  title: string;
  content: string;
  priority: 'normal' | 'important' | 'urgent';
  isPinned: boolean;
  publishedAt: string;
};
