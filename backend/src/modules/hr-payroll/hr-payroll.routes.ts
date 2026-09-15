import { Hono } from 'hono';
import { requireHr, type AppEnv } from '../../middleware/auth.middleware.js';
import { generate, list, save, updateStatus } from './hr-payroll.controller.js';

export const hrPayrollRoutes = new Hono<AppEnv>()
  .use('*', requireHr)
  .get('/', list)
  .post('/generate', generate)
  .post('/', save)
  .patch('/:id/status', updateStatus);
