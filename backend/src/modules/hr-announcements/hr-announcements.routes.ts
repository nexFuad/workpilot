import { Hono } from 'hono';
import { requireHr, type AppEnv } from '../../middleware/auth.middleware.js';
import { create, list, remove, update } from './hr-announcements.controller.js';

export const hrAnnouncementsRoutes = new Hono<AppEnv>()
  .use('*', requireHr)
  .get('/', list)
  .post('/', create)
  .patch('/:id', update)
  .delete('/:id', remove);
