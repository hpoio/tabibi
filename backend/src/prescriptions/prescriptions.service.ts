import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from '../pdf/pdf.service';
import { CreatePrescriptionDto, UpdatePrescriptionDto } from './dto/prescription.dto';

@Injectable()
export class PrescriptionsService {
  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
  ) {}

  /**
   * إنشاء وصفة طبية.
   * "النسخ الاحتياطي التلقائي" في المرحلة 1-2 يتحقق ببساطة عبر كون كل وصفة
   * تُحفظ فوراً ودائماً في PostgreSQL (وليست في ذاكرة مؤقتة) — أي انقطاع
   * في المتصفح/التطبيق لا يفقد البيانات لأنها محفوظة عند الحفظ لحظياً.
   * نسخ احتياطي على مستوى قاعدة البيانات نفسها (snapshots/backups دورية)
   * هو إعداد بنية تحتية (Infrastructure) يُفعَّل على مستوى استضافة
   * PostgreSQL (مثال: pg_dump مجدول، أو خدمة مُدارة كـ RDS/Supabase التي
   * توفر نسخاً احتياطية تلقائية جاهزة) — وليس كود تطبيق.
   */
  async create(doctorUserId: string, dto: CreatePrescriptionDto) {
    const doctorProfile = await this.getDoctorProfile(doctorUserId);

    const patient = await this.prisma.patientProfile.findUnique({
      where: { id: dto.patientId },
    });
    if (!patient) throw new NotFoundException('المريض غير موجود');

    const prescription = await this.prisma.prescription.create({
      data: {
        patientId: dto.patientId,
        doctorId: doctorProfile.id,
        items: {
          create: dto.items.map((item) => ({
            drugName: item.drugName,
            scientificName: item.scientificName,
            dosage: item.dosage,
            duration: item.duration,
            notes: item.notes,
          })),
        },
      },
      include: { items: true },
    });

    return prescription;
  }

  async findByPatient(doctorUserId: string, patientId: string) {
    await this.getDoctorProfile(doctorUserId);
    return this.prisma.prescription.findMany({
      where: { patientId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * تعديل وصفة موجودة: يستبدل كل عناصرها بالعناصر الجديدة المرسَلة.
   * أبسط وأضمن طريقة لتفادي تعقيد مطابقة كل عنصر قديم بعنصر جديد يدوياً.
   */
  async update(doctorUserId: string, prescriptionId: string, dto: UpdatePrescriptionDto) {
    const doctorProfile = await this.getDoctorProfile(doctorUserId);

    const prescription = await this.prisma.prescription.findFirst({
      where: { id: prescriptionId, doctorId: doctorProfile.id },
    });
    if (!prescription) throw new NotFoundException('الوصفة غير موجودة');

    await this.prisma.prescriptionItem.deleteMany({ where: { prescriptionId } });

    return this.prisma.prescription.update({
      where: { id: prescriptionId },
      data: {
        items: {
          create: dto.items.map((item) => ({
            drugName: item.drugName,
            scientificName: item.scientificName,
            dosage: item.dosage,
            duration: item.duration,
            notes: item.notes,
          })),
        },
      },
      include: { items: true },
    });
  }

  /** توليد وتنزيل PDF الوصفة عند الطلب (لا يُخزَّن تلقائياً في هذا الإصدار التجريبي) */
  async getPdf(doctorUserId: string, prescriptionId: string): Promise<Buffer> {
    const doctorProfile = await this.getDoctorProfile(doctorUserId);

    const prescription = await this.prisma.prescription.findFirst({
      where: { id: prescriptionId, doctorId: doctorProfile.id },
      include: {
        items: true,
        patient: true,
        doctor: { include: { user: true } },
      },
    });
    if (!prescription) throw new NotFoundException('الوصفة غير موجودة');

    const ageMs = Date.now() - prescription.patient.birthDate.getTime();
    const age = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 365.25));

    return this.pdfService.generatePrescriptionPdf({
      clinicName: doctorProfile.clinicName ?? 'العيادة الطبية',
      doctorName: prescription.doctor.user.fullName,
      doctorSpecialty: doctorProfile.specialty,
      patientName: prescription.patient.fullName,
      patientAge: age,
      date: prescription.createdAt,
      items: prescription.items.map((i) => ({
        drugName: i.drugName,
        dosage: i.dosage ?? '',
        duration: i.duration ?? '',
        notes: i.notes ?? undefined,
      })),
    });
  }

  private async getDoctorProfile(userId: string) {
    const profile = await this.prisma.doctorProfile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException('هذا الحساب ليس حساب طبيب');
    return profile;
  }
}