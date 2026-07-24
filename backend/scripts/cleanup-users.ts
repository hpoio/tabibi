import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const KEEP_PHONE = '0657744371'; // رقم هاتف مريم - سيتم الإبقاء على هذا الحساب فقط

async function main() {
  const toKeep = await prisma.user.findUnique({ where: { phone: KEEP_PHONE } });

  if (!toKeep) {
    console.error(`❌ لم يتم العثور على أي حساب برقم الهاتف ${KEEP_PHONE}. تم إيقاف العملية لتفادي حذف كل شيء بالخطأ.`);
    process.exit(1);
  }

  const usersToDelete = await prisma.user.findMany({
    where: { phone: { not: KEEP_PHONE } },
    select: { id: true, fullName: true, phone: true, role: true },
  });

  console.log(`✅ سيتم الإبقاء على: ${toKeep.fullName} (${toKeep.phone})`);
  console.log(`🗑️  سيتم حذف ${usersToDelete.length} حساب:`);
  usersToDelete.forEach((u) => console.log(`   - ${u.fullName} (${u.phone}) [${u.role}]`));

  if (usersToDelete.length === 0) {
    console.log('لا يوجد أي حساب آخر لحذفه.');
    return;
  }

  const idsToDelete = usersToDelete.map((u) => u.id);

  const result = await prisma.user.deleteMany({
    where: { id: { in: idsToDelete } },
  });

  console.log(`✅ تم حذف ${result.count} حساب بنجاح. تم الإبقاء فقط على حساب ${toKeep.fullName}.`);
}

main()
  .catch((e) => {
    console.error('حدث خطأ:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });