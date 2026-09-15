import { Hono } from 'hono';
import { requireAuth, type AppEnv } from '../../middleware/auth.middleware.js';
import { list, updateStatus } from './tasks.controller.js';

export const taskRoutes = new Hono<AppEnv>()
  .use('*', requireAuth)
  .get('/', list)
  .patch('/:id/status', updateStatus);
