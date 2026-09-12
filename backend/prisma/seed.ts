import 'dotenv/config';
import { hash } from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required to seed demo users.');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const users = [
  { employeeId: 'nexstack1', companyName: 'nexstack1', password: 'nexstack1', role: 'admin' },
  { employeeId: 'nexstack2', companyName: 'nexstack2', password: 'nexstack2', role: 'hr' },
  { employeeId: 'nexstack3', companyName: 'nexstack3', password: 'nexstack3', role: 'employee' },
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
  console.log('Seeded 3 role-based demo users.');
}

main().finally(() => prisma.$disconnect());
