import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { env } from './config/env.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { attendanceRoutes } from './modules/attendance/attendance.routes.js';
import { leaveRoutes } from './modules/leave/leave.routes.js';
import { compensationRoutes } from './modules/compensation/compensation.routes.js';
import { taskRoutes } from './modules/tasks/tasks.routes.js';
import { projectRoutes } from './modules/projects/projects.routes.js';
import { documentRoutes } from './modules/documents/documents.routes.js';
import { announcementRoutes } from './modules/announcements/announcements.routes.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';
import { hrAttendanceRoutes } from './modules/hr/hr-attendance.routes.js';
import { hrSettingsRoutes } from './modules/hr/hr-settings.routes.js';
import { hrLeaveRoutes } from './modules/hr/hr-leave.routes.js';
import { hrPayrollRoutes } from './modules/hr/hr-payroll.routes.js';
import { hrAdvancesRoutes } from './modules/hr/hr-advances.routes.js';
import { hrLoansRoutes } from './modules/hr/hr-loans.routes.js';
import { hrAnnouncementsRoutes } from './modules/hr/hr-announcements.routes.js';
import { hrTasksRoutes } from './modules/hr/hr-tasks.routes.js';
import { hrProjectsRoutes } from './modules/hr/hr-projects.routes.js';
import { hrEmployeesRoutes } from './modules/hr/hr-employees.routes.js';
export const app = new Hono();
const allowedOrigins = env.NODE_ENV === 'production' ? [env.FRONTEND_URL] : [env.FRONTEND_URL, 'http://localhost:3000'];
app.use('*', cors({
    origin: allowedOrigins,
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    maxAge: 86_400,
}));
app.get('/', (c) => c.json({ name: 'WorkPilot API', status: 'ok' }));
app.get('/api/health', (c) => c.json({ status: 'ok' }));
app.route('/api/auth', authRoutes);
app.route('/api/attendance', attendanceRoutes);
app.route('/api/leaves', leaveRoutes);
app.route('/api/compensation', compensationRoutes);
app.route('/api/tasks', taskRoutes);
app.route('/api/projects', projectRoutes);
app.route('/api/documents', documentRoutes);
app.route('/api/announcements', announcementRoutes);
app.route('/api/dashboard', dashboardRoutes);
app.route('/api/hr/attendance', hrAttendanceRoutes);
app.route('/api/hr', hrSettingsRoutes);
app.route('/api/hr/leaves', hrLeaveRoutes);
app.route('/api/hr/payroll', hrPayrollRoutes);
app.route('/api/hr/advances', hrAdvancesRoutes);
app.route('/api/hr/loans', hrLoansRoutes);
app.route('/api/hr/announcements', hrAnnouncementsRoutes);
app.route('/api/hr/tasks', hrTasksRoutes);
app.route('/api/hr/projects', hrProjectsRoutes);
app.route('/api/hr/employees', hrEmployeesRoutes);
export default app;
