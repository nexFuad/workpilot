import type { Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { env } from '../../config/env.js';
import { ApiError } from '../../lib/api-error.js';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  authUser,
  type AppEnv,
} from '../../middleware/auth.middleware.js';
import { loginSchema, passwordSchema, profileSchema } from './auth.schema.js';
import {
  authenticateUser,
  createLoginSession,
  getCurrentUser,
  revokeRefreshToken,
  rotateRefreshToken,
  updatePassword,
  updateProfile,
} from './auth.service.js';

const cookieBase = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? ('None' as const) : ('Lax' as const),
  partitioned: env.NODE_ENV === 'production',
  path: '/',
};

function setAuthCookies(
  c: Context,
  accessToken: string,
  refreshToken: string,
  refreshDays: number,
) {
  setCookie(c, ACCESS_COOKIE, accessToken, { ...cookieBase, maxAge: 15 * 60 });
  setCookie(c, REFRESH_COOKIE, refreshToken, {
    ...cookieBase,
    maxAge: refreshDays * 24 * 60 * 60,
  });
}

function clearAuthCookies(c: Context) {
  deleteCookie(c, ACCESS_COOKIE, cookieBase);
  deleteCookie(c, REFRESH_COOKIE, cookieBase);
}

export async function login(c: Context) {
  const parsed = loginSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) throw new ApiError(400, 'Please provide valid login details.');

  const user = await authenticateUser(
    parsed.data.employeeId,
    parsed.data.companyName,
    parsed.data.password,
  );
  if (!user) {
    throw new ApiError(401, 'Employee ID, company name, or password is incorrect.');
  }

  const loginSession = await createLoginSession(user, parsed.data.rememberMe);
  setAuthCookies(c, loginSession.accessToken, loginSession.refreshToken, loginSession.refreshDays);
  return c.json({ user: loginSession.user });
}

export async function refresh(c: Context) {
  try {
    const refreshSession = await rotateRefreshToken(getCookie(c, REFRESH_COOKIE) ?? '');
    setAuthCookies(
      c,
      refreshSession.accessToken,
      refreshSession.refreshToken,
      refreshSession.refreshDays,
    );
    return c.json({ user: refreshSession.user });
  } catch {
    clearAuthCookies(c);
    throw new ApiError(401, 'Your session has expired. Please sign in again.');
  }
}

export async function logout(c: Context) {
  await revokeRefreshToken(getCookie(c, REFRESH_COOKIE));
  clearAuthCookies(c);
  return c.json({ message: 'Logged out successfully.' });
}

export async function session(c: Context) {
  try {
    return c.json({ user: await getCurrentUser(getCookie(c, ACCESS_COOKIE) ?? '') });
  } catch {
    const refreshToken = getCookie(c, REFRESH_COOKIE);
    if (!refreshToken) return c.json({ user: null });
    try {
      const refreshSession = await rotateRefreshToken(refreshToken);
      setAuthCookies(
        c,
        refreshSession.accessToken,
        refreshSession.refreshToken,
        refreshSession.refreshDays,
      );
      return c.json({ user: refreshSession.user });
    } catch {
      clearAuthCookies(c);
      return c.json({ user: null });
    }
  }
}

export async function me(c: Context<AppEnv>) {
  return c.json({ user: authUser(c) });
}

export async function patchProfile(c: Context<AppEnv>) {
  const parsed = profileSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message ?? 'Invalid profile.');
  }
  return c.json({ user: await updateProfile(authUser(c).id, parsed.data) });
}

export async function patchPassword(c: Context<AppEnv>) {
  const parsed = passwordSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    throw new ApiError(400, 'New password must have at least 8 characters.');
  }
  if (!(await updatePassword(authUser(c).id, parsed.data))) {
    throw new ApiError(400, 'Current password is incorrect.');
  }
  return c.json({ message: 'Password updated.' });
}
