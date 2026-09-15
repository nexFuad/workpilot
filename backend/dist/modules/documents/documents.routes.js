import { getCookie } from 'hono/cookie';
import { Hono } from 'hono';
import { getListQuery, pagination } from '../../lib/list-query.js';
import { prisma } from '../../lib/prisma.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { documentReviewSchema, documentSchema } from './documents.schema.js';
async function currentUser(c) {
    try {
        return await getCurrentUser(getCookie(c, 'workpilot_access') ?? '');
    }
    catch {
        return null;
    }
}
export const documentRoutes = new Hono()
    .get('/', async (c) => {
    const user = await currentUser(c);
    if (!user)
        return c.json({ message: 'Unauthorized.' }, 401);
    const search = c.req.query('search')?.trim();
    const where = {
        userId: user.id,
        ...(search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { fileType: { contains: search, mode: 'insensitive' } },
                    { status: { contains: search, mode: 'insensitive' } },
                    { reviewerNote: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {}),
    };
    const documents = await prisma.employeeDocument.findMany({
        where,
        orderBy: { createdAt: 'desc' },
    });
    return c.json({ documents });
})
    .post('/', async (c) => {
    const user = await currentUser(c);
    if (!user)
        return c.json({ message: 'Unauthorized.' }, 401);
    const parsed = documentSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success)
        return c.json({ message: parsed.error.issues[0]?.message ?? 'Invalid document.' }, 400);
    const document = await prisma.employeeDocument.create({
        data: { ...parsed.data, userId: user.id },
    });
    return c.json({ document }, 201);
})
    .get('/review', async (c) => {
    const reviewer = await currentUser(c);
    if (!reviewer)
        return c.json({ message: 'Unauthorized.' }, 401);
    if (reviewer.role !== 'hr')
        return c.json({ message: 'Only HR can review documents.' }, 403);
    const query = getListQuery(c);
    const status = ['pending', 'approved', 'rejected'].includes(query.status ?? '')
        ? query.status
        : undefined;
    const where = {
        ...(status ? { status } : {}),
        ...(query.search
            ? {
                OR: [
                    { name: { contains: query.search, mode: 'insensitive' } },
                    { fileType: { contains: query.search, mode: 'insensitive' } },
                    {
                        user: {
                            is: {
                                OR: [
                                    { employeeId: { contains: query.search, mode: 'insensitive' } },
                                    { fullName: { contains: query.search, mode: 'insensitive' } },
                                ],
                            },
                        },
                    },
                ],
            }
            : {}),
    };
    const [documents, total] = await Promise.all([
        prisma.employeeDocument.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: query.skip,
            take: query.limit,
            include: { user: { select: { employeeId: true, fullName: true, companyName: true } } },
        }),
        prisma.employeeDocument.count({ where }),
    ]);
    return c.json({ documents, pagination: pagination(total, query.page, query.limit) });
})
    .patch('/:id/review', async (c) => {
    const reviewer = await currentUser(c);
    if (!reviewer)
        return c.json({ message: 'Unauthorized.' }, 401);
    if (reviewer.role !== 'hr')
        return c.json({ message: 'Only HR can review documents.' }, 403);
    const parsed = documentReviewSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success)
        return c.json({ message: 'Invalid review.' }, 400);
    const document = await prisma.employeeDocument
        .update({
        where: { id: c.req.param('id') },
        data: { ...parsed.data, reviewedAt: new Date() },
    })
        .catch(() => null);
    if (!document)
        return c.json({ message: 'Document not found.' }, 404);
    return c.json({ document });
})
    .delete('/:id', async (c) => {
    const reviewer = await currentUser(c);
    if (!reviewer)
        return c.json({ message: 'Unauthorized.' }, 401);
    if (reviewer.role !== 'hr')
        return c.json({ message: 'Only HR can delete documents.' }, 403);
    const document = await prisma.employeeDocument
        .delete({ where: { id: c.req.param('id') } })
        .catch(() => null);
    if (!document)
        return c.json({ message: 'Document not found.' }, 404);
    return c.json({ message: 'Document deleted successfully.' });
});
