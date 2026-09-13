import { getCookie } from 'hono/cookie';
import { Hono, type Context } from 'hono';
import { prisma } from '../../lib/prisma.js';
import { getCurrentUser } from '../auth/auth.service.js';
async function currentUser(c: Context) { try { return await getCurrentUser(getCookie(c, 'workpilot_access') ?? ''); } catch { return null; } }
export const dashboardRoutes = new Hono().get('/employee', async (c) => {
  const user = await currentUser(c); if (!user) return c.json({ message: 'Unauthorized.' }, 401);
  const [attendance, leaves, salary, advances, loans, tasks, projects, documents, announcements] = await Promise.all([
    prisma.attendance.findFirst({ where: { userId: user.id, checkOutAt: null }, orderBy: { checkInAt: 'desc' }, include: { checkInSite: true } }),
    prisma.leaveRequest.count({ where: { userId: user.id, status: 'pending' } }),
    prisma.salaryPayment.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
    prisma.salaryAdvanceRequest.findMany({ where: { userId: user.id, status: 'approved' } }),
    prisma.loan.findMany({ where: { userId: user.id, status: 'active' } }),
    prisma.task.findMany({ where: { userId: user.id }, orderBy: { dueDate: 'asc' } }),
    prisma.projectAssignment.findMany({ where: { userId: user.id }, include: { project: true } }),
    prisma.employeeDocument.count({ where: { userId: user.id, status: 'pending' } }),
    prisma.announcement.findMany({ orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }], take: 3 }),
  ]);
  const loanInstallment = loans.reduce((total, loan) => total + loan.installment, 0);
  const advanceAmount = salary ? advances.filter((item) => item.settlementMonth === salary.month).reduce((total, item) => total + item.amount, 0) : 0;
  const netSalary = salary ? salary.basic + salary.allowances + salary.bonus - salary.tax - salary.providentFund - advanceAmount - loanInstallment : null;
  return c.json({ attendance: attendance ? { site: attendance.checkInSite.name, checkInAt: attendance.checkInAt } : null, pendingLeaves: leaves, salary: salary ? { month: salary.month, netSalary, status: salary.status } : null, loanInstallment, openTasks: tasks.filter((task) => task.status !== 'completed').length, dueTasks: tasks.filter((task) => task.status !== 'completed').slice(0, 4), activeProjects: projects.filter((item) => item.project.status === 'active').length, pendingDocuments: documents, announcements });
});
