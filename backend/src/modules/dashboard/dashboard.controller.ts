import type { Context } from 'hono';
import { authUser, type AppEnv } from '../../middleware/auth.middleware.js';
import { getEmployeeDashboard, getHrDashboard } from './dashboard.service.js';

export async function employee(c: Context<AppEnv>) {
  return c.json(await getEmployeeDashboard(authUser(c).id));
}

export async function hr(c: Context<AppEnv>) {
  return c.json(await getHrDashboard());
}
