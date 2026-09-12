import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { Hono } from 'hono';
import { env } from '../../config/env.js';
import { loginSchema } from './auth.schema.js';
import { authenticateUser, createLoginSession, getCurrentUser, revokeRefreshToken, rotateRefreshToken, } from './auth.service.js';
const ACCESS_COOKIE = 'workpilot_access';
const REFRESH_COOKIE = 'workpilot_refresh';
const cookieBase = {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'None' : 'Lax',
    path: '/',
};
function setAuthCookies(c, accessToken, refreshToken, refreshDays) {
    setCookie(c, ACCESS_COOKIE, accessToken, { ...cookieBase, maxAge: 15 * 60 });
    setCookie(c, REFRESH_COOKIE, refreshToken, { ...cookieBase, maxAge: refreshDays * 24 * 60 * 60 });
}
export const authRoutes = new Hono()
    .post('/login', async (c) => {
    const payload = loginSchema.safeParse(await c.req.json().catch(() => null));
    if (!payload.success)
        return c.json({ message: 'Please provide valid login details.' }, 400);
    const user = await authenticateUser(payload.data.employeeId, payload.data.companyName, payload.data.password);
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
    }
    catch {
        deleteCookie(c, ACCESS_COOKIE, { path: '/' });
        deleteCookie(c, REFRESH_COOKIE, { path: '/' });
        return c.json({ message: 'Your session has expired. Please sign in again.' }, 401);
    }
})
    .post('/logout', async (c) => {
    await revokeRefreshToken(getCookie(c, REFRESH_COOKIE));
    deleteCookie(c, ACCESS_COOKIE, { path: '/' });
    deleteCookie(c, REFRESH_COOKIE, { path: '/' });
    return c.json({ message: 'Logged out successfully.' });
})
    .get('/session', async (c) => {
    try {
        return c.json({ user: await getCurrentUser(getCookie(c, ACCESS_COOKIE) ?? '') });
    }
    catch {
        const refreshToken = getCookie(c, REFRESH_COOKIE);
        if (!refreshToken)
            return c.json({ user: null });
        try {
            const session = await rotateRefreshToken(refreshToken);
            setAuthCookies(c, session.accessToken, session.refreshToken, session.refreshDays);
            return c.json({ user: session.user });
        }
        catch {
            deleteCookie(c, ACCESS_COOKIE, { path: '/' });
            deleteCookie(c, REFRESH_COOKIE, { path: '/' });
            return c.json({ user: null });
        }
    }
})
    .get('/me', async (c) => {
    try {
        return c.json({ user: await getCurrentUser(getCookie(c, ACCESS_COOKIE) ?? '') });
    }
    catch {
        return c.json({ message: 'Unauthorized.' }, 401);
    }
});
