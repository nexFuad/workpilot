import { Hono } from 'hono';
import { requireHr, type AppEnv } from '../../middleware/auth.middleware.js';
import { create, details, list, remove, update, updateStatus } from './hr-employees.controller.js';

export const hrEmployeesRoutes = new Hono<AppEnv>()
  .use('*', requireHr)
  .get('/', list)
  .get('/:id', details)
  .post('/', create)
  .patch('/:id/status', updateStatus)
  .patch('/:id', update)
  .delete('/:id', remove);
