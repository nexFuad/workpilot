import type { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import { ApiError } from '../lib/api-error.js';
import { getCurrentUser, type PublicUser } from '../modules/auth/auth.service.js';

export const ACCESS_COOKIE = 'workpilot_access';
export const REFRESH_COOKIE = 'workpilot_refresh';

export type AppEnv = {
  Variables: {
    user: PublicUser;
  };
};

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  try {
    const user = await getCurrentUser(getCookie(c, ACCESS_COOKIE) ?? '');
    c.set('user', user);
    await next();
  } catch {
    throw new ApiError(401, 'Unauthorized.');
  }
});

export const requireHr = createMiddleware<AppEnv>(async (c, next) => {
  try {
    const user = await getCurrentUser(getCookie(c, ACCESS_COOKIE) ?? '');
    if (user.role !== 'hr') throw new ApiError(403, 'HR access is required.');
    c.set('user', user);
    await next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, 'Unauthorized.');
  }
});

export const requireHrRole = createMiddleware<AppEnv>(async (c, next) => {
  if (c.get('user').role !== 'hr') throw new ApiError(403, 'HR access is required.');
  await next();
});

export function authUser(c: Context<AppEnv>) {
  return c.get('user');
}
