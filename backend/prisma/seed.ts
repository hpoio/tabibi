import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { DRUG_SEED_DATA } from './drug-seed-data';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const doctorUser = await prisma.user.create({
    data: {
      fullName: 'د. أمين بلقاسمي',
      phone: '0555000111',
      email: 'doctor@example.com',
      passwordHash,
      role: Role.DOCTOR,
      doctorProfile: {
        create: { specialty: 'عام', clinicName: 'عيادة النور - الجزائر العاصمة' },
      },
    },
    include: { doctorProfile: true },
  });

  const patient = await prisma.patientProfile.create({
    data: {
      fullName: 'سعاد بن علي',
      birthDate: new Date('1988-03-14'),
      gender: 'F',
      phone: '0666111222',
      address: 'حيدرة، الجزائر',
      primaryDoctorId: doctorUser.doctorProfile!.id,
    },
  });

  await prisma.appointment.create({
    data: {
      doctorId: doctorUser.doctorProfile!.id,
      patientId: patient.id,
      type: 'FOLLOW_UP',
      scheduledAt: new Date(),
      notes: 'كونترول ضغط الدم',
    },
  });

  console.log('✅ تم إدخال بيانات تجريبية بنجاح');
  console.log('👨‍⚕️ تسجيل دخول الطبيب: 0555000111 / password123');

  await prisma.drug.createMany({ data: DRUG_SEED_DATA });
  console.log(`💊 تم إدخال ${DRUG_SEED_DATA.length} دواء في قاعدة البيانات`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
