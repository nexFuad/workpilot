import { Hono } from 'hono';
import { requireAuth, requireHrRole, type AppEnv } from '../../middleware/auth.middleware.js';
import { employee, hr } from './dashboard.controller.js';

export const dashboardRoutes = new Hono<AppEnv>()
  .use('*', requireAuth)
  .get('/employee', employee)
  .get('/hr', requireHrRole, hr);
