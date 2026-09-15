import { Hono } from 'hono';
import { requireAuth, type AppEnv } from '../../middleware/auth.middleware.js';
import {
  createCheckIn,
  createCheckOut,
  current,
  history,
  options,
} from './attendance.controller.js';

export const attendanceRoutes = new Hono<AppEnv>()
  .use('*', requireAuth)
  .get('/options', options)
  .get('/current', current)
  .get('/history', history)
  .post('/check-in', createCheckIn)
  .post('/check-out', createCheckOut);
