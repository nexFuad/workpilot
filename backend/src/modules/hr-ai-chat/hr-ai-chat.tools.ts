import { prisma } from '../../lib/prisma.js';

type ToolArgs = { date?: string; query?: string };

const dayRange = (raw?: string) => {
  const date =
    raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00.000Z`) : new Date();
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { gte: start, lt: end };
};

export const hrChatTools = [
  {
    type: 'function',
    function: {
      name: 'get_company_summary',
      description: 'Get live HR dashboard totals for the current company.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_employee_full_profile',
      description:
        'Get the complete HR profile for one employee or HR user, using their name or employee ID.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_sites_and_shifts',
      description: 'Get all configured sites and shifts in the HR workspace.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_workforce_analytics',
      description:
        'Get workforce analytics: headcount by department, designation, employment status, and employment type.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_work_management_summary',
      description:
        'Get live tasks and projects analytics, including task status counts, overdue task count, and project progress.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_finance_requests_summary',
      description: 'Get pending salary advance and loan requests with employee names and totals.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_documents_summary',
      description:
        'Get employee document counts and document status analytics for the current company.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_announcements',
      description: 'Get recent active company announcements.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_attendance_summary',
      description:
        'Get attendance totals and absent employee names for a date. Use YYYY-MM-DD when the user specifies a date.',
      parameters: {
        type: 'object',
        properties: { date: { type: 'string' } },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_pending_leaves',
      description: 'Get pending leave requests in the current company.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_employees',
      description:
        'Search employees by name, employee ID, department, designation, email, or phone.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_payroll_summary',
      description: 'Get current company payroll totals and payment statuses.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
] as const;

export async function executeHrChatTool(name: string, args: ToolArgs, companyName: string) {
  const employeeWhere = { companyName, role: { in: ['employee', 'hr'] } };
  if (name === 'get_company_summary') {
    const [
      totalEmployees,
      activeEmployees,
      pendingLeaves,
      pendingAdvances,
      pendingLoans,
      activeProjects,
    ] = await Promise.all([
      prisma.user.count({ where: employeeWhere }),
      prisma.user.count({ where: { ...employeeWhere, isActive: true } }),
      prisma.leaveRequest.count({ where: { status: 'pending', user: { is: { companyName } } } }),
      prisma.salaryAdvanceRequest.count({
        where: { status: 'pending', user: { is: { companyName } } },
      }),
      prisma.loanRequest.count({ where: { status: 'pending', user: { is: { companyName } } } }),
      prisma.project.count({
        where: { status: 'active', assignments: { some: { user: { companyName } } } },
      }),
    ]);
    return {
      totalEmployees,
      activeEmployees,
      pendingLeaves,
      pendingAdvances,
      pendingLoans,
      activeProjects,
    };
  }
  if (name === 'get_attendance_summary') {
    const range = dayRange(args.date);
    const [employees, records] = await Promise.all([
      prisma.user.findMany({
        where: { companyName, role: 'employee', isActive: true },
        select: { id: true, fullName: true, employeeId: true },
      }),
      prisma.attendance.findMany({
        where: { checkInAt: range, user: { companyName } },
        select: { userId: true },
      }),
    ]);
    const present = new Set(records.map((record) => record.userId));
    const absent = employees
      .filter((employee) => !present.has(employee.id))
      .slice(0, 20)
      .map(({ fullName, employeeId }) => ({ fullName, employeeId }));
    return {
      date: args.date ?? new Date().toISOString().slice(0, 10),
      total: employees.length,
      present: present.size,
      absentCount: employees.length - present.size,
      absent,
    };
  }
  if (name === 'get_pending_leaves') {
    const requests = await prisma.leaveRequest.findMany({
      where: { status: 'pending', user: { is: { companyName } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { user: { select: { fullName: true, employeeId: true } } },
    });
    return requests.map((request) => ({
      employee: request.user,
      leaveType: request.leaveType,
      startDate: request.startDate.toISOString().slice(0, 10),
      endDate: request.endDate.toISOString().slice(0, 10),
      reason: request.reason,
    }));
  }
  if (name === 'search_employees') {
    const query = args.query?.trim() ?? '';
    if (!query) return [];
    const employees = await prisma.user.findMany({
      where: {
        ...employeeWhere,
        OR: [
          { fullName: { contains: query, mode: 'insensitive' } },
          { employeeId: { contains: query, mode: 'insensitive' } },
          { department: { contains: query, mode: 'insensitive' } },
          { designation: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 10,
      select: {
        employeeId: true,
        fullName: true,
        department: true,
        designation: true,
        employmentStatus: true,
        email: true,
        phone: true,
      },
    });
    return employees;
  }
  if (name === 'get_payroll_summary') {
    const payments = await prisma.salaryPayment.findMany({
      where: { user: { is: { companyName } } },
      select: {
        basic: true,
        allowances: true,
        bonus: true,
        tax: true,
        providentFund: true,
        status: true,
        month: true,
      },
    });
    const totals = payments.reduce(
      (result, item) => ({
        gross: result.gross + item.basic + item.allowances + item.bonus,
        deductions: result.deductions + item.tax + item.providentFund,
        paid: result.paid + (item.status === 'paid' ? 1 : 0),
        upcoming: result.upcoming + (item.status === 'upcoming' ? 1 : 0),
      }),
      { gross: 0, deductions: 0, paid: 0, upcoming: 0 },
    );
    return {
      payments: payments.length,
      ...totals,
      net: totals.gross - totals.deductions,
      months: [...new Set(payments.map((item) => item.month))].slice(0, 6),
    };
  }
  if (name === 'get_employee_full_profile') {
    const query = args.query?.trim() ?? '';
    if (!query) return { message: 'An employee name or employee ID is required.' };
    const employee = await prisma.user.findFirst({
      where: {
        ...employeeWhere,
        OR: [
          { employeeId: { equals: query, mode: 'insensitive' } },
          { fullName: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        employeeId: true,
        fullName: true,
        email: true,
        phone: true,
        address: true,
        gender: true,
        department: true,
        designation: true,
        joiningDate: true,
        employmentType: true,
        employmentStatus: true,
        role: true,
        basicSalary: true,
        salaryAllowances: true,
        salaryBonus: true,
        salaryTax: true,
        salaryProvidentFund: true,
        salaryType: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        emergencyContactAddress: true,
        defaultSite: { select: { name: true, location: true } },
        defaultShift: { select: { name: true, startTime: true, endTime: true } },
      },
    });
    return employee ?? { message: 'No employee was found for that search.' };
  }
  if (name === 'get_sites_and_shifts') {
    const [sites, shifts] = await Promise.all([
      prisma.site.findMany({
        orderBy: { name: 'asc' },
        select: { name: true, location: true, isActive: true },
      }),
      prisma.shift.findMany({
        orderBy: { startTime: 'asc' },
        select: { name: true, startTime: true, endTime: true, isActive: true },
      }),
    ]);
    return { sites, shifts };
  }
  if (name === 'get_workforce_analytics') {
    const people = await prisma.user.findMany({
      where: employeeWhere,
      select: { department: true, designation: true, employmentStatus: true, employmentType: true },
    });
    const group = (key: keyof (typeof people)[number]) =>
      Object.entries(
        people.reduce<Record<string, number>>((result, person) => {
          const label = person[key] || 'Not specified';
          result[label] = (result[label] ?? 0) + 1;
          return result;
        }, {}),
      ).map(([label, count]) => ({ label, count }));
    return {
      total: people.length,
      byDepartment: group('department'),
      byDesignation: group('designation'),
      byStatus: group('employmentStatus'),
      byEmploymentType: group('employmentType'),
    };
  }
  if (name === 'get_work_management_summary') {
    const now = new Date();
    const [tasks, projects] = await Promise.all([
      prisma.task.findMany({
        where: { user: { is: { companyName } } },
        select: { status: true, dueDate: true },
      }),
      prisma.project.findMany({
        where: { assignments: { some: { user: { companyName } } } },
        select: { name: true, status: true, progress: true, endDate: true },
      }),
    ]);
    const taskStatuses = tasks.reduce<Record<string, number>>((result, task) => {
      result[task.status] = (result[task.status] ?? 0) + 1;
      return result;
    }, {});
    return {
      tasks: {
        total: tasks.length,
        byStatus: taskStatuses,
        overdue: tasks.filter(
          (task) => task.status !== 'completed' && task.dueDate && task.dueDate < now,
        ).length,
      },
      projects: projects.map((project) => ({
        name: project.name,
        status: project.status,
        progress: project.progress,
        endDate: project.endDate?.toISOString().slice(0, 10) ?? null,
      })),
    };
  }
  if (name === 'get_finance_requests_summary') {
    const [advances, loans] = await Promise.all([
      prisma.salaryAdvanceRequest.findMany({
        where: { status: 'pending', user: { is: { companyName } } },
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { fullName: true, employeeId: true } } },
      }),
      prisma.loanRequest.findMany({
        where: { status: 'pending', user: { is: { companyName } } },
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { fullName: true, employeeId: true } } },
      }),
    ]);
    return {
      pendingAdvances: {
        count: advances.length,
        totalAmount: advances.reduce((sum, item) => sum + item.amount, 0),
        requests: advances.map((item) => ({
          employee: item.user,
          amount: item.amount,
          settlementMonth: item.settlementMonth,
        })),
      },
      pendingLoans: {
        count: loans.length,
        totalAmount: loans.reduce((sum, item) => sum + item.amount, 0),
        requests: loans.map((item) => ({
          employee: item.user,
          amount: item.amount,
          tenure: item.tenure,
          purpose: item.purpose,
        })),
      },
    };
  }
  if (name === 'get_documents_summary') {
    const documents = await prisma.employeeDocument.findMany({
      where: { user: { is: { companyName } } },
      select: { status: true },
    });
    return {
      total: documents.length,
      byStatus: documents.reduce<Record<string, number>>((result, document) => {
        result[document.status] = (result[document.status] ?? 0) + 1;
        return result;
      }, {}),
    };
  }
  if (name === 'get_announcements') {
    const announcements = await prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
      take: 10,
      select: { title: true, content: true, priority: true, isPinned: true, publishedAt: true },
    });
    return announcements.map((item) => ({
      ...item,
      publishedAt: item.publishedAt.toISOString().slice(0, 10),
    }));
  }
  throw new Error('Unsupported HR data tool.');
}
