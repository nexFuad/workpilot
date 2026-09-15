import { Hono } from 'hono';
import { requireHr, type AppEnv } from '../../middleware/auth.middleware.js';
import { list, updateStatus } from './hr-leave.controller.js';

export const hrLeaveRoutes = new Hono<AppEnv>()
  .use('*', requireHr)
  .get('/', list)
  .patch('/:id/status', updateStatus);
