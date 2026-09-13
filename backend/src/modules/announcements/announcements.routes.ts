import { getCookie } from 'hono/cookie';
import { Hono, type Context } from 'hono';
import { prisma } from '../../lib/prisma.js';
import { getCurrentUser } from '../auth/auth.service.js';
async function currentUser(c: Context) { try { return await getCurrentUser(getCookie(c, 'workpilot_access') ?? ''); } catch { return null; } }
export const announcementRoutes = new Hono().get('/', async (c) => { const user = await currentUser(c); if (!user) return c.json({ message: 'Unauthorized.' }, 401); const announcements = await prisma.announcement.findMany({ orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }] }); return c.json({ announcements }); });
