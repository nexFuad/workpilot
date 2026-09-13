import { getCookie } from 'hono/cookie';
import { Hono } from 'hono';
import { prisma } from '../../lib/prisma.js';
import { getCurrentUser } from '../auth/auth.service.js';
async function currentUser(c) {
    try {
        return await getCurrentUser(getCookie(c, 'workpilot_access') ?? '');
    }
    catch {
        return null;
    }
}
export const projectRoutes = new Hono().get('/', async (c) => {
    const user = await currentUser(c);
    if (!user)
        return c.json({ message: 'Unauthorized.' }, 401);
    const assignments = await prisma.projectAssignment.findMany({ where: { userId: user.id }, orderBy: { project: { endDate: 'asc' } }, include: { project: true } });
    return c.json({ projects: assignments.map(({ role, joinedAt, project }) => ({ ...project, role, joinedAt })) });
});
