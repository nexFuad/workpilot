import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { Hono } from 'hono';
import { env } from '../../config/env.js';
import { loginSchema, passwordSchema, profileSchema } from './auth.schema.js';
import { compare, hash } from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import {
  authenticateUser,
  createLoginSession,
  getCurrentUser,
  revokeRefreshToken,
  rotateRefreshToken,
} from './auth.service.js';

const ACCESS_COOKIE = 'workpilot_access';
const REFRESH_COOKIE = 'workpilot_refresh';
const cookieBase = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? ('None' as const) : ('Lax' as const),
  partitioned: env.NODE_ENV === 'production',
  path: '/',
};

function setAuthCookies(
  c: Parameters<typeof setCookie>[0],
  accessToken: string,
  refreshToken: string,
  refreshDays: number,
) {
  setCookie(c, ACCESS_COOKIE, accessToken, { ...cookieBase, maxAge: 15 * 60 });
  setCookie(c, REFRESH_COOKIE, refreshToken, { ...cookieBase, maxAge: refreshDays * 24 * 60 * 60 });
}

function clearAuthCookies(c: Parameters<typeof deleteCookie>[0]) {
  deleteCookie(c, ACCESS_COOKIE, cookieBase);
  deleteCookie(c, REFRESH_COOKIE, cookieBase);
}

export const authRoutes = new Hono()
  .post('/login', async (c) => {
    const payload = loginSchema.safeParse(await c.req.json().catch(() => null));
    if (!payload.success) return c.json({ message: 'Please provide valid login details.' }, 400);
    const user = await authenticateUser(
      payload.data.employeeId,
      payload.data.companyName,
      payload.data.password,
    );
    if (!user)
      return c.json({ message: 'Employee ID, company name, or password is incorrect.' }, 401);
    const session = await createLoginSession(user, payload.data.rememberMe);
    setAuthCookies(c, session.accessToken, session.refreshToken, session.refreshDays);
    return c.json({ user: session.user });
  })
  .post('/refresh', async (c) => {
    try {
      const session = await rotateRefreshToken(getCookie(c, REFRESH_COOKIE) ?? '');
      setAuthCookies(c, session.accessToken, session.refreshToken, session.refreshDays);
      return c.json({ user: session.user });
    } catch {
      clearAuthCookies(c);
      return c.json({ message: 'Your session has expired. Please sign in again.' }, 401);
    }
  })
  .post('/logout', async (c) => {
    await revokeRefreshToken(getCookie(c, REFRESH_COOKIE));
    clearAuthCookies(c);
    return c.json({ message: 'Logged out successfully.' });
  })
  .get('/session', async (c) => {
    try {
      return c.json({ user: await getCurrentUser(getCookie(c, ACCESS_COOKIE) ?? '') });
    } catch {
      const refreshToken = getCookie(c, REFRESH_COOKIE);
      if (!refreshToken) return c.json({ user: null });
      try {
        const session = await rotateRefreshToken(refreshToken);
        setAuthCookies(c, session.accessToken, session.refreshToken, session.refreshDays);
        return c.json({ user: session.user });
      } catch {
        clearAuthCookies(c);
        return c.json({ user: null });
      }
    }
  })
  .get('/me', async (c) => {
    try {
      return c.json({ user: await getCurrentUser(getCookie(c, ACCESS_COOKIE) ?? '') });
    } catch {
      return c.json({ message: 'Unauthorized.' }, 401);
    }
  })
  .patch('/profile', async (c) => {
    try {
      const user = await getCurrentUser(getCookie(c, ACCESS_COOKIE) ?? '');
      const parsed = profileSchema.safeParse(await c.req.json().catch(() => null));
      if (!parsed.success)
        return c.json({ message: parsed.error.issues[0]?.message ?? 'Invalid profile.' }, 400);
      const input = parsed.data;
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(input.fullName !== undefined ? { fullName: input.fullName || null } : {}),
          ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
          ...(input.address !== undefined ? { address: input.address || null } : {}),
          ...(input.profileImage !== undefined ? { profileImage: input.profileImage || null } : {}),
        },
      });
      return c.json({
        user: {
          id: updated.id,
          employeeId: updated.employeeId,
          companyName: updated.companyName,
          role: updated.role,
          fullName: updated.fullName,
          phone: updated.phone,
          address: updated.address,
          profileImage: updated.profileImage,
        },
      });
    } catch {
      return c.json({ message: 'Unauthorized.' }, 401);
    }
  })
  .patch('/password', async (c) => {
    try {
      const user = await getCurrentUser(getCookie(c, ACCESS_COOKIE) ?? '');
      const parsed = passwordSchema.safeParse(await c.req.json().catch(() => null));
      if (!parsed.success)
        return c.json({ message: 'New password must have at least 8 characters.' }, 400);
      const account = await prisma.user.findUnique({ where: { id: user.id } });
      if (!account || !(await compare(parsed.data.currentPassword, account.passwordHash)))
        return c.json({ message: 'Current password is incorrect.' }, 400);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await hash(parsed.data.newPassword, 12) },
      });
      return c.json({ message: 'Password updated.' });
    } catch {
      return c.json({ message: 'Unauthorized.' }, 401);
    }
  });
