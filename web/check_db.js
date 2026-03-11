const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.systemAdmin.findFirst();
  const citizen = await prisma.citizen.findFirst();
  const reg = await prisma.registrar.findFirst();
  console.log('Admin:', admin);
  console.log('Citizen:', citizen);
  console.log('Registrar:', reg);
}
main().catch(console.error).finally(() => prisma.$disconnect());
