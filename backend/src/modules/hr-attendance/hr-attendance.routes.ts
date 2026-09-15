import { Hono } from 'hono';
import { requireHr, type AppEnv } from '../../middleware/auth.middleware.js';
import { list } from './hr-attendance.controller.js';

export const hrAttendanceRoutes = new Hono<AppEnv>().use('*', requireHr).get('/', list);
