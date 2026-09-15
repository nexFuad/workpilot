import { Hono } from 'hono';
import { requireAuth, type AppEnv } from '../../middleware/auth.middleware.js';
import { list, markRead } from './announcements.controller.js';

export const announcementRoutes = new Hono<AppEnv>()
  .use('*', requireAuth)
  .get('/', list)
  .post('/:id/read', markRead);
