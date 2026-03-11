const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const roles = [
    'citizen', 'patrolOfficer', 'detective', 'supervisor', 
    'prosecutor', 'judicialAdmin', 'forensicOfficer', 'systemAdmin', 'registrar'
  ];
  
  console.log('--- USER REGISTRY CHECK ---');
  for (const role of roles) {
    const users = await prisma[role].findMany();
    console.log(`${role.toUpperCase()}: ${users.length} users`);
    users.forEach(u => console.log(`  - ${u.email} (ID: ${u.id})`));
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
