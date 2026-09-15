import { Hono } from 'hono';
import { requireAuth, type AppEnv } from '../../middleware/auth.middleware.js';
import { create, list, remove, update } from './leave.controller.js';

export const leaveRoutes = new Hono<AppEnv>()
  .use('*', requireAuth)
  .get('/', list)
  .post('/', create)
  .patch('/:id', update)
  .delete('/:id', remove);
