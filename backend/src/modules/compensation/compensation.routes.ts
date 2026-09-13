import { getCookie } from 'hono/cookie';
import { Hono, type Context } from 'hono';
import { prisma } from '../../lib/prisma.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { advanceRequestSchema, loanRequestSchema, reviewSchema } from './compensation.schema.js';

async function currentUser(c: Context) {
  try { return await getCurrentUser(getCookie(c, 'workpilot_access') ?? ''); } catch { return null; }
}
const isReviewer = (role: string) => role === 'admin' || role === 'hr';

export const compensationRoutes = new Hono()
  .get('/salary', async (c) => {
    const user = await currentUser(c); if (!user) return c.json({ message: 'Unauthorized.' }, 401);
    const [payments, advances, loans] = await Promise.all([
      prisma.salaryPayment.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
      prisma.salaryAdvanceRequest.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
      prisma.loan.findMany({ where: { userId: user.id, status: 'active' } }),
    ]);
    return c.json({ payments, advances, loans });
  })
  .post('/salary/advances', async (c) => {
    const user = await currentUser(c); if (!user) return c.json({ message: 'Unauthorized.' }, 401);
    const parsed = advanceRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ message: parsed.error.issues[0]?.message ?? 'Invalid advance request.' }, 400);
    const payment = await prisma.salaryPayment.findFirst({ where: { userId: user.id, month: parsed.data.settlementMonth } });
    if (!payment) return c.json({ message: 'No salary record exists for the selected month.' }, 400);
    const netSalary = payment.basic + payment.allowances + payment.bonus - payment.tax - payment.providentFund;
    if (parsed.data.amount > netSalary) return c.json({ message: 'Advance cannot exceed your net salary.' }, 400);
    const advance = await prisma.salaryAdvanceRequest.create({ data: { ...parsed.data, userId: user.id } });
    return c.json({ advance }, 201);
  })
  .get('/loans', async (c) => {
    const user = await currentUser(c); if (!user) return c.json({ message: 'Unauthorized.' }, 401);
    const [requests, loans] = await Promise.all([
      prisma.loanRequest.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
      prisma.loan.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
    ]);
    return c.json({ requests, loans });
  })
  .post('/loans', async (c) => {
    const user = await currentUser(c); if (!user) return c.json({ message: 'Unauthorized.' }, 401);
    const parsed = loanRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ message: parsed.error.issues[0]?.message ?? 'Invalid loan request.' }, 400);
    const request = await prisma.loanRequest.create({ data: { ...parsed.data, userId: user.id } });
    return c.json({ request }, 201);
  })
  .patch('/review/advances/:id', async (c) => {
    const reviewer = await currentUser(c); if (!reviewer) return c.json({ message: 'Unauthorized.' }, 401);
    if (!isReviewer(reviewer.role)) return c.json({ message: 'Only HR or admin can review requests.' }, 403);
    const parsed = reviewSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ message: 'Invalid review status.' }, 400);
    const advance = await prisma.salaryAdvanceRequest.update({ where: { id: c.req.param('id') }, data: { status: parsed.data.status, reviewedAt: new Date() } }).catch(() => null);
    if (!advance) return c.json({ message: 'Advance request not found.' }, 404); return c.json({ advance });
  })
  .patch('/review/loans/:id', async (c) => {
    const reviewer = await currentUser(c); if (!reviewer) return c.json({ message: 'Unauthorized.' }, 401);
    if (!isReviewer(reviewer.role)) return c.json({ message: 'Only HR or admin can review requests.' }, 403);
    const parsed = reviewSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ message: 'Invalid review status.' }, 400);
    const request = await prisma.loanRequest.update({ where: { id: c.req.param('id') }, data: { status: parsed.data.status, reviewedAt: new Date() } }).catch(() => null);
    if (!request) return c.json({ message: 'Loan request not found.' }, 404);
    if (parsed.data.status === 'approved') await prisma.loan.upsert({ where: { requestId: request.id }, update: {}, create: { userId: request.userId, requestId: request.id, principal: request.amount, outstanding: request.amount, installment: Math.ceil(request.amount / request.tenure), tenure: request.tenure, nextDue: new Date() } });
    return c.json({ request });
  });
