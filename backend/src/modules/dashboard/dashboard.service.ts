import { utcDayRange } from '../../lib/date.js';
import { prisma } from '../../lib/prisma.js';

export async function getEmployeeDashboard(userId: string) {
  const [attendance, leaves, salary, advances, loans, tasks, projects, documents, announcements] =
    await Promise.all([
      prisma.attendance.findFirst({
        where: { userId, checkOutAt: null },
        orderBy: { checkInAt: 'desc' },
        include: { checkInSite: true },
      }),
      prisma.leaveRequest.count({ where: { userId, status: 'pending' } }),
      prisma.salaryPayment.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      prisma.salaryAdvanceRequest.findMany({ where: { userId, status: 'approved' } }),
      prisma.loan.findMany({ where: { userId, status: 'active' } }),
      prisma.task.findMany({ where: { userId }, orderBy: { dueDate: 'asc' } }),
      prisma.projectAssignment.findMany({ where: { userId }, include: { project: true } }),
      prisma.employeeDocument.count({ where: { userId, status: 'pending' } }),
      prisma.announcement.findMany({
        where: { isActive: true },
        orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
        take: 3,
      }),
    ]);
  const loanInstallment = loans.reduce((total, loan) => total + loan.installment, 0);
  const advanceAmount = salary
    ? advances
        .filter((item) => item.settlementMonth === salary.month)
        .reduce((total, item) => total + item.amount, 0)
    : 0;
  const netSalary = salary
    ? salary.basic +
      salary.allowances +
      salary.bonus -
      salary.tax -
      salary.providentFund -
      advanceAmount -
      loanInstallment
    : null;
  return {
    attendance: attendance
      ? { site: attendance.checkInSite.name, checkInAt: attendance.checkInAt }
      : null,
    pendingLeaves: leaves,
    salary: salary ? { month: salary.month, netSalary, status: salary.status } : null,
    loanInstallment,
    openTasks: tasks.filter((task) => task.status !== 'completed').length,
    dueTasks: tasks.filter((task) => task.status !== 'completed').slice(0, 4),
    activeProjects: projects.filter((item) => item.project.status === 'active').length,
    pendingDocuments: documents,
    announcements,
  };
}

export async function getHrDashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const range = utcDayRange(today)!;
  const latestPayroll = await prisma.salaryPayment.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { month: true },
  });
  const [
    totalEmployees,
    activeEmployees,
    employees,
    attendanceRecords,
    pendingLeaves,
    pendingAdvances,
    pendingLoans,
    pendingDocuments,
    openTasks,
    activeProjects,
    payrollRecords,
    leaveRequests,
    advanceRequests,
    loanRequests,
    documentRequests,
    recentEmployees,
    priorityTasks,
    announcements,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'employee' } }),
    prisma.user.count({ where: { role: 'employee', isActive: true } }),
    prisma.user.findMany({
      where: { role: 'employee', isActive: true },
      orderBy: { fullName: 'asc' },
      select: { id: true, employeeId: true, fullName: true, profileImage: true },
    }),
    prisma.attendance.findMany({
      where: { checkInAt: range },
      orderBy: { checkInAt: 'desc' },
      include: {
        checkInSite: { select: { name: true } },
        checkInShift: { select: { name: true } },
      },
    }),
    prisma.leaveRequest.count({ where: { status: 'pending' } }),
    prisma.salaryAdvanceRequest.count({ where: { status: 'pending' } }),
    prisma.loanRequest.count({ where: { status: 'pending' } }),
    prisma.employeeDocument.count({ where: { status: 'pending' } }),
    prisma.task.count({ where: { status: { not: 'completed' } } }),
    prisma.project.count({ where: { status: 'active' } }),
    latestPayroll
      ? prisma.salaryPayment.findMany({ where: { month: latestPayroll.month } })
      : Promise.resolve([]),
    prisma.leaveRequest.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: 4,
      include: { user: { select: { employeeId: true, fullName: true } } },
    }),
    prisma.salaryAdvanceRequest.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: 4,
      include: { user: { select: { employeeId: true, fullName: true } } },
    }),
    prisma.loanRequest.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: 4,
      include: { user: { select: { employeeId: true, fullName: true } } },
    }),
    prisma.employeeDocument.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: 4,
      include: { user: { select: { employeeId: true, fullName: true } } },
    }),
    prisma.user.findMany({
      where: { role: 'employee' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        employeeId: true,
        fullName: true,
        designation: true,
        department: true,
        profileImage: true,
        isActive: true,
        createdAt: true,
        defaultSite: { select: { name: true } },
      },
    }),
    prisma.task.findMany({
      where: { status: { not: 'completed' } },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      take: 5,
      include: { user: { select: { employeeId: true, fullName: true } } },
    }),
    prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
      take: 4,
      select: {
        id: true,
        title: true,
        content: true,
        priority: true,
        isPinned: true,
        publishedAt: true,
      },
    }),
  ]);
  const attendanceByEmployee = new Map(
    attendanceRecords.map((attendance) => [attendance.userId, attendance]),
  );
  const attendance = employees.map((employee) => {
    const record = attendanceByEmployee.get(employee.id);
    return {
      employee,
      status: record ? (record.checkOutAt ? 'completed' : 'working') : 'absent',
      checkInAt: record?.checkInAt ?? null,
      checkOutAt: record?.checkOutAt ?? null,
      site: record?.checkInSite.name ?? null,
      shift: record?.checkInShift.name ?? null,
    };
  });
  const presentToday = attendance.filter((item) => item.status !== 'absent').length;
  const payroll = payrollRecords.reduce(
    (totals, payment) => ({
      gross: totals.gross + payment.basic + payment.allowances + payment.bonus,
      deductions: totals.deductions + payment.tax + payment.providentFund,
      net:
        totals.net +
        payment.basic +
        payment.allowances +
        payment.bonus -
        payment.tax -
        payment.providentFund,
      paid: totals.paid + (payment.status === 'paid' ? 1 : 0),
    }),
    { gross: 0, deductions: 0, net: 0, paid: 0 },
  );
  const pendingRequests = [
    ...leaveRequests.map((request) => ({
      id: request.id,
      type: 'Leave request',
      employee: request.user.fullName || request.user.employeeId,
      employeeId: request.user.employeeId,
      detail: `${request.leaveType} · ${request.reason}`,
      amount: null,
      createdAt: request.createdAt,
      href: '/hr/leave',
    })),
    ...advanceRequests.map((request) => ({
      id: request.id,
      type: 'Salary advance',
      employee: request.user.fullName || request.user.employeeId,
      employeeId: request.user.employeeId,
      detail: `${request.settlementMonth} · ${request.reason}`,
      amount: request.amount,
      createdAt: request.createdAt,
      href: '/hr/advances',
    })),
    ...loanRequests.map((request) => ({
      id: request.id,
      type: 'Loan request',
      employee: request.user.fullName || request.user.employeeId,
      employeeId: request.user.employeeId,
      detail: `${request.tenure} months · ${request.purpose}`,
      amount: request.amount,
      createdAt: request.createdAt,
      href: '/hr/loans',
    })),
    ...documentRequests.map((request) => ({
      id: request.id,
      type: 'Document review',
      employee: request.user.fullName || request.user.employeeId,
      employeeId: request.user.employeeId,
      detail: request.name,
      amount: null,
      createdAt: request.createdAt,
      href: '/hr/documents',
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6);
  return {
    generatedAt: new Date(),
    summary: {
      totalEmployees,
      activeEmployees,
      presentToday,
      absentToday: Math.max(activeEmployees - presentToday, 0),
      pendingLeaves,
      pendingAdvances,
      pendingLoans,
      pendingDocuments,
      openTasks,
      activeProjects,
    },
    attendance: { date: today, rows: attendance.slice(0, 6) },
    payroll: latestPayroll
      ? {
          month: latestPayroll.month,
          records: payrollRecords.length,
          upcoming: payrollRecords.length - payroll.paid,
          ...payroll,
        }
      : null,
    pendingRequests,
    recentEmployees,
    tasks: priorityTasks,
    announcements,
  };
}
