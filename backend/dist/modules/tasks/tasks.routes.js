import { getCookie } from 'hono/cookie';
import { Hono } from 'hono';
import { prisma } from '../../lib/prisma.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { taskStatusSchema } from './tasks.schema.js';
async function currentUser(c) {
    try {
        return await getCurrentUser(getCookie(c, 'workpilot_access') ?? '');
    }
    catch {
        return null;
    }
}
export const taskRoutes = new Hono()
    .get('/', async (c) => {
    const user = await currentUser(c);
    if (!user)
        return c.json({ message: 'Unauthorized.' }, 401);
    const tasks = await prisma.task.findMany({ where: { userId: user.id }, orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }] });
    return c.json({ tasks });
})
    .patch('/:id/status', async (c) => {
    const user = await currentUser(c);
    if (!user)
        return c.json({ message: 'Unauthorized.' }, 401);
    const parsed = taskStatusSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success)
        return c.json({ message: 'Select a valid task status.' }, 400);
    const task = await prisma.task.findFirst({ where: { id: c.req.param('id'), userId: user.id } });
    if (!task)
        return c.json({ message: 'Task not found.' }, 404);
    const updated = await prisma.task.update({ where: { id: task.id }, data: { status: parsed.data.status } });
    return c.json({ task: updated });
});
