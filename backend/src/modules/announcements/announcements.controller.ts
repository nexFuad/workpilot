import type { Context } from 'hono';
import { ApiError } from '../../lib/api-error.js';
import { authUser, type AppEnv } from '../../middleware/auth.middleware.js';
import { announcementIdSchema } from './announcements.schema.js';
import { listAnnouncements, markAnnouncementRead } from './announcements.service.js';

export async function list(c: Context<AppEnv>) {
  return c.json(await listAnnouncements(authUser(c).id, c.req.query('search')?.trim() ?? ''));
}

export async function markRead(c: Context<AppEnv>) {
  const id = announcementIdSchema.safeParse(c.req.param('id'));
  if (!id.success) throw new ApiError(400, 'Invalid announcement ID.');
  const receipt = await markAnnouncementRead(id.data, authUser(c).id);
  return c.json({ readAt: receipt.readAt });
}
