import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Get 3 citizens, 3 patrol officers, 3 detectives, 3 supervisors, 3 prosecutors, 3 judicial admins, 3 forensic officers, 3 system admins, 3 registrars
  const citizens = await prisma.citizen.findMany({ take: 3 });
  const patrols = await prisma.patrolOfficer.findMany({ take: 3 });
  const detectives = await prisma.detective.findMany({ take: 3 });
  const supervisors = await prisma.supervisor.findMany({ take: 3 });
  const prosecutors = await prisma.prosecutor.findMany({ take: 3 });
  const judicials = await prisma.judicialAdmin.findMany({ take: 3 });
  const forensics = await prisma.forensicOfficer.findMany({ take: 3 });
  // Create 3 incidents for each citizen
  for (let i = 0; i < 3; i++) {
    const citizen = citizens[i];
    const incident = await prisma.incident.create({
      data: {
        citizenId: citizen.id,
        description: `Incident ${i+1} reported by ${citizen.email}`,
        location: `Location ${i+1}`,
      },
    });
    // Create a case for each incident, assign to detective
    const detective = detectives[i];
    const caseItem = await prisma.case.create({
      data: {
        incidentId: incident.id,
        detectiveId: detective.id,
        classification: 'THEFT',
      },
    });
    // Add evidence by forensic officer
    const forensic = forensics[i];
    await prisma.evidence.create({
      data: {
        caseId: caseItem.id,
        type: 'DOCUMENT',
        fileUrl: `https://files.com/evidence${i+1}.pdf`,
        description: `Evidence for case ${caseItem.id}`,
        forensicOfficerId: forensic.id,
      },
    });
    // Add a report by forensic officer
    await prisma.forensicReport.create({
      data: {
        caseId: caseItem.id,
        officerId: forensic.id,
        findings: `Findings for case ${caseItem.id}`,
      },
    });
    // Add a court record by judicial admin
    const judicial = judicials[i];
    await prisma.courtRecord.create({
      data: {
        caseId: caseItem.id,
        charge: 'THEFT',
        verdict: 'GUILTY',
        sentence: '2 years',
      },
    });
  }
  console.log('Created 3 cases for all roles in hierarchy.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
