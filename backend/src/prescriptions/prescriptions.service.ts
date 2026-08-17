import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from '../pdf/pdf.service';
import { StaffResolverService, CurrentUserPayload } from '../common/services/staff-resolver.service';
import { CreatePrescriptionDto, UpdatePrescriptionDto } from './dto/prescription.dto';

@Injectable()
export class PrescriptionsService {
  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
    private staffResolver: StaffResolverService,
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
  async create(user: CurrentUserPayload, dto: CreatePrescriptionDto) {
    const doctorId = await this.staffResolver.resolveDoctorId(user);
    await this.staffResolver.assertPatientOwnedByDoctor(doctorId, dto.patientId);

    const prescription = await this.prisma.prescription.create({
      data: {
        patientId: dto.patientId,
        doctorId,
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

  async findByPatient(user: CurrentUserPayload, patientId: string) {
    const doctorId = await this.staffResolver.resolveDoctorId(user);
    await this.staffResolver.assertPatientOwnedByDoctor(doctorId, patientId);

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
  async update(user: CurrentUserPayload, prescriptionId: string, dto: UpdatePrescriptionDto) {
    const doctorId = await this.staffResolver.resolveDoctorId(user);

    const prescription = await this.prisma.prescription.findFirst({
      where: { id: prescriptionId, doctorId },
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
  async getPdf(user: CurrentUserPayload, prescriptionId: string): Promise<Buffer> {
    const doctorId = await this.staffResolver.resolveDoctorId(user);
    const doctorProfile = await this.prisma.doctorProfile.findUnique({ where: { id: doctorId } });
    if (!doctorProfile) throw new NotFoundException('الطبيب غير موجود');

    const prescription = await this.prisma.prescription.findFirst({
      where: { id: prescriptionId, doctorId },
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
}