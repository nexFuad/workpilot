import { Hono } from 'hono';
import { requireHr, type AppEnv } from '../../middleware/auth.middleware.js';
import { create, list, remove, update } from './hr-tasks.controller.js';

export const hrTasksRoutes = new Hono<AppEnv>()
  .use('*', requireHr)
  .get('/', list)
  .post('/', create)
  .patch('/:id', update)
  .delete('/:id', remove);
