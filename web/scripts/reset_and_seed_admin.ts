import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Delete all data from all tables (order matters for FKs)
  await prisma.auditLog.deleteMany();
  await prisma.courtRecord.deleteMany();
  await prisma.forensicReport.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.case.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.suspect.deleteMany();
  await prisma.citizen.deleteMany();
  await prisma.patrolOfficer.deleteMany();
  await prisma.detective.deleteMany();
  await prisma.supervisor.deleteMany();
  await prisma.prosecutor.deleteMany();
  await prisma.judicialAdmin.deleteMany();
  await prisma.forensicOfficer.deleteMany();
  await prisma.systemAdmin.deleteMany();
  await prisma.registrar.deleteMany();

  // Create main admin
  const passwordHash = await bcrypt.hash('Admin123!', 10);
  await prisma.systemAdmin.create({
    data: {
      name: 'Main Admin',
      email: 'mainadmin@guardiannet.com',
      passwordHash,
      biometric_registered: false,
    }
  });
  console.log('Database wiped and main admin created.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
