import { Hono } from 'hono';
import { requireHr, type AppEnv } from '../../middleware/auth.middleware.js';
import {
  createShiftRecord,
  createSiteRecord,
  removeShift,
  removeSite,
  shifts,
  sites,
  updateShiftRecord,
  updateSiteRecord,
} from './hr-settings.controller.js';

export const hrSettingsRoutes = new Hono<AppEnv>()
  .use('*', requireHr)
  .get('/sites', sites)
  .post('/sites', createSiteRecord)
  .patch('/sites/:id', updateSiteRecord)
  .delete('/sites/:id', removeSite)
  .get('/shifts', shifts)
  .post('/shifts', createShiftRecord)
  .patch('/shifts/:id', updateShiftRecord)
  .delete('/shifts/:id', removeShift);
