import { Hono } from 'hono';
import { requireHr, type AppEnv } from '../../middleware/auth.middleware.js';
import { list, updateStatus } from './hr-advances.controller.js';

export const hrAdvancesRoutes = new Hono<AppEnv>()
  .use('*', requireHr)
  .get('/', list)
  .patch('/:id/status', updateStatus);
