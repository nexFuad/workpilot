import { Hono } from 'hono';
import { requireHr, type AppEnv } from '../../middleware/auth.middleware.js';
import { list, updateStatus } from './hr-loans.controller.js';

export const hrLoansRoutes = new Hono<AppEnv>()
  .use('*', requireHr)
  .get('/', list)
  .patch('/:id/status', updateStatus);
