import { Hono } from 'hono';
import { requireAuth, type AppEnv } from '../../middleware/auth.middleware.js';
import {
  login,
  logout,
  me,
  patchPassword,
  patchProfile,
  refresh,
  session,
} from './auth.controller.js';

export const authRoutes = new Hono<AppEnv>()
  .post('/login', login)
  .post('/refresh', refresh)
  .post('/logout', logout)
  .get('/session', session)
  .get('/me', requireAuth, me)
  .patch('/profile', requireAuth, patchProfile)
  .patch('/password', requireAuth, patchPassword);
