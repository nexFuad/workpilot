import { Hono } from 'hono';
import { requireAuth, type AppEnv } from '../../middleware/auth.middleware.js';
import { list } from './projects.controller.js';

export const projectRoutes = new Hono<AppEnv>().use('*', requireAuth).get('/', list);
