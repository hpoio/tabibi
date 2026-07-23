const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.secretaryProfile.count();
  console.log('عدد السجلات الحالية:', count);
}
main().finally(() => prisma.$disconnect());
