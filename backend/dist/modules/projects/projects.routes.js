import { getCookie } from 'hono/cookie';
import { Hono } from 'hono';
import { getListQuery, pagination } from '../../lib/list-query.js';
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
    const query = getListQuery(c, 12);
    const status = ['planned', 'active', 'on_hold', 'completed'].includes(query.status ?? '')
        ? query.status
        : undefined;
    const progressSearch = /^\d{1,3}$/.test(query.search) ? Number(query.search) : null;
    const where = {
        userId: user.id,
        project: {
            is: {
                ...(status ? { status } : {}),
            },
        },
        ...(query.search
            ? {
                OR: [
                    { role: { contains: query.search, mode: 'insensitive' } },
                    {
                        project: {
                            is: {
                                OR: [
                                    { name: { contains: query.search, mode: 'insensitive' } },
                                    { description: { contains: query.search, mode: 'insensitive' } },
                                    { status: { contains: query.search, mode: 'insensitive' } },
                                    ...(progressSearch === null ? [] : [{ progress: progressSearch }]),
                                    {
                                        assignments: {
                                            some: {
                                                OR: [
                                                    { role: { contains: query.search, mode: 'insensitive' } },
                                                    {
                                                        user: {
                                                            is: {
                                                                OR: [
                                                                    {
                                                                        employeeId: {
                                                                            contains: query.search,
                                                                            mode: 'insensitive',
                                                                        },
                                                                    },
                                                                    {
                                                                        fullName: {
                                                                            contains: query.search,
                                                                            mode: 'insensitive',
                                                                        },
                                                                    },
                                                                ],
                                                            },
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                    },
                                ],
                            },
                        },
                    },
                ],
            }
            : {}),
    };
    const [assignments, total, allAssignments] = await Promise.all([
        prisma.projectAssignment.findMany({
            where,
            orderBy: { project: { endDate: 'asc' } },
            skip: query.skip,
            take: query.limit,
            include: {
                project: {
                    include: {
                        assignments: {
                            orderBy: { joinedAt: 'asc' },
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        employeeId: true,
                                        fullName: true,
                                        profileImage: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        }),
        prisma.projectAssignment.count({ where }),
        prisma.projectAssignment.findMany({
            where: { userId: user.id },
            select: { role: true, project: { select: { status: true, progress: true } } },
        }),
    ]);
    const progress = allAssignments.reduce((sum, item) => sum + item.project.progress, 0);
    return c.json({
        projects: assignments.map(({ role, joinedAt, project }) => {
            const { assignments: teamMembers, ...projectDetails } = project;
            return { ...projectDetails, role, joinedAt, teamMembers };
        }),
        pagination: pagination(total, query.page, query.limit),
        summary: {
            total: allAssignments.length,
            active: allAssignments.filter((item) => item.project.status === 'active').length,
            averageProgress: allAssignments.length ? Math.round(progress / allAssignments.length) : 0,
            roles: new Set(allAssignments.map((item) => item.role)).size,
        },
    });
});
