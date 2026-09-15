import type { Context } from 'hono';
import { parseJsonBody, pathParam } from '../../lib/validation.js';
import type { AppEnv } from '../../middleware/auth.middleware.js';
import { announcementSchema } from './hr-announcements.schema.js';
import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  updateAnnouncement,
} from './hr-announcements.service.js';

export async function list(c: Context<AppEnv>) {
  const page = Math.max(Number.parseInt(c.req.query('page') ?? '0', 10) || 0, 0);
  const limit = Math.min(Math.max(Number.parseInt(c.req.query('limit') ?? '6', 10) || 6, 1), 20);
  return c.json(await listAnnouncements(page, limit, c.req.query('search')?.trim() ?? ''));
}

export async function create(c: Context<AppEnv>) {
  const input = await parseJsonBody(
    c,
    announcementSchema,
    'Please provide valid announcement details.',
  );
  return c.json({ announcement: await createAnnouncement(input) }, 201);
}

export async function update(c: Context<AppEnv>) {
  const input = await parseJsonBody(
    c,
    announcementSchema,
    'Please provide valid announcement details.',
  );
  return c.json({ announcement: await updateAnnouncement(pathParam(c, 'id'), input) });
}

export async function remove(c: Context<AppEnv>) {
  await deleteAnnouncement(pathParam(c, 'id'));
  return c.json({ message: 'Announcement deleted.' });
}
