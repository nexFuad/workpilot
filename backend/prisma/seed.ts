import 'dotenv/config';
import { hash } from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required to seed demo users.');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const users = [
  { employeeId: 'nexstack2', companyName: 'nexstack2', password: 'nexstack2', role: 'hr' },
  { employeeId: 'nexstack3', companyName: 'nexstack3', password: 'nexstack3', role: 'employee' },
];
const sites = [
  { name: 'Head Office', location: 'Dhaka' },
  { name: 'Corporate Office', location: 'Gulshan, Dhaka' },
  { name: 'Factory A', location: 'Gazipur' },
  { name: 'Factory B', location: 'Narayanganj' },
  { name: 'Remote Site', location: 'Remote' },
];
const shifts = [
  { name: 'Morning Shift', startTime: '08:00', endTime: '16:00' },
  { name: 'General Shift', startTime: '09:00', endTime: '17:00' },
  { name: 'Day Shift', startTime: '10:00', endTime: '18:00' },
  { name: 'Evening Shift', startTime: '14:00', endTime: '22:00' },
  { name: 'Night Shift', startTime: '22:00', endTime: '06:00' },
];

async function main() {
  for (const user of users) {
    const passwordHash = await hash(user.password, 12);
    await prisma.user.upsert({
      where: {
        employeeId_companyName: { employeeId: user.employeeId, companyName: user.companyName },
      },
      update: { passwordHash, role: user.role, isActive: true },
      create: {
        employeeId: user.employeeId,
        companyName: user.companyName,
        passwordHash,
        role: user.role,
      },
    });
  }
  for (const site of sites)
    await prisma.site.upsert({ where: { name: site.name }, update: site, create: site });
  for (const shift of shifts)
    await prisma.shift.upsert({ where: { name: shift.name }, update: shift, create: shift });
  if (!(await prisma.announcement.count()))
    await prisma.announcement.createMany({
      data: [
        {
          title: 'September payroll schedule',
          content:
            'September salary will be processed on 30 September. Please ensure your bank information is up to date.',
          priority: 'important',
          isPinned: true,
        },
        {
          title: 'Mandatory security awareness training',
          content: 'All employees must complete the security awareness training by 20 September.',
          priority: 'normal',
        },
        {
          title: 'Office maintenance notice',
          content:
            'The office network will undergo scheduled maintenance this Friday from 8:00 PM to 10:00 PM.',
          priority: 'normal',
        },
      ],
    });
  const employee = await prisma.user.findUnique({
    where: { employeeId_companyName: { employeeId: 'nexstack3', companyName: 'nexstack3' } },
  });
  if (employee) {
    const salaries = [
      {
        month: 'September 2026',
        period: '1–30 September 2026',
        basic: 48000,
        allowances: 7000,
        bonus: 2500,
        tax: 4100,
        providentFund: 2400,
        status: 'upcoming',
      },
      {
        month: 'August 2026',
        period: '1–31 August 2026',
        basic: 48000,
        allowances: 7000,
        bonus: 0,
        tax: 3900,
        providentFund: 2400,
        status: 'paid',
        paidOn: new Date('2026-08-31'),
      },
    ];
    for (const salary of salaries)
      await prisma.salaryPayment.upsert({
        where: { userId_month: { userId: employee.id, month: salary.month } },
        update: salary,
        create: { ...salary, userId: employee.id },
      });
    const existingLoan = await prisma.loan.findFirst({
      where: { userId: employee.id, status: 'active' },
    });
    if (!existingLoan) {
      const request = await prisma.loanRequest.create({
        data: {
          userId: employee.id,
          amount: 60000,
          purpose: 'Home repair',
          tenure: 12,
          status: 'approved',
          reviewedAt: new Date(),
        },
      });
      await prisma.loan.create({
        data: {
          userId: employee.id,
          requestId: request.id,
          principal: 60000,
          outstanding: 30000,
          installment: 5000,
          tenure: 12,
          paidInstallments: 6,
          nextDue: new Date('2026-09-30'),
        },
      });
    }
    const taskCount = await prisma.task.count({ where: { userId: employee.id } });
    if (!taskCount)
      await prisma.task.createMany({
        data: [
          {
            userId: employee.id,
            title: 'Review September project plan',
            description: 'Check milestones, risks, and next actions with the project team.',
            priority: 'high',
            status: 'in_progress',
            dueDate: new Date('2026-09-16'),
          },
          {
            userId: employee.id,
            title: 'Submit weekly progress report',
            description: 'Share this week’s completed work and blockers.',
            priority: 'medium',
            status: 'todo',
            dueDate: new Date('2026-09-18'),
          },
          {
            userId: employee.id,
            title: 'Update client documentation',
            description: 'Add the latest implementation notes to the shared document.',
            priority: 'low',
            status: 'todo',
            dueDate: new Date('2026-09-22'),
          },
          {
            userId: employee.id,
            title: 'Complete security awareness training',
            description: 'Finish the mandatory training module.',
            priority: 'medium',
            status: 'completed',
            dueDate: new Date('2026-09-10'),
          },
        ],
      });
    const projectCount = await prisma.projectAssignment.count({ where: { userId: employee.id } });
    if (!projectCount) {
      const projects = await Promise.all([
        prisma.project.create({
          data: {
            name: 'WorkPilot employee portal',
            description: 'Improve the employee self-service workspace and its everyday workflows.',
            progress: 72,
            startDate: new Date('2026-07-01'),
            endDate: new Date('2026-10-15'),
          },
        }),
        prisma.project.create({
          data: {
            name: 'Client onboarding refresh',
            description: 'Streamline client handover documentation and the onboarding checklist.',
            progress: 38,
            startDate: new Date('2026-08-15'),
            endDate: new Date('2026-11-30'),
          },
        }),
      ]);
      await prisma.projectAssignment.createMany({
        data: projects.map((project, index) => ({
          projectId: project.id,
          userId: employee.id,
          role: index === 0 ? 'Frontend contributor' : 'Documentation contributor',
        })),
      });
    }
  }
  console.log('Seeded demo users, sites, and shifts.');
}

main().finally(() => prisma.$disconnect());
