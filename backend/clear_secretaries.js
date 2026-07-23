const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const deleted = await prisma.secretaryProfile.deleteMany({});
  console.log('تم حذف', deleted.count, 'سجل');
}
main().finally(() => prisma.$disconnect());
