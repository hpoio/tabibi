import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { LabResultRequestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StaffResolverService, CurrentUserPayload } from '../common/services/staff-resolver.service';
import { ParsedLabLine } from '../ocr/ocr.service';
import { ApproveLabResultRequestDto, RejectLabResultRequestDto } from './dto/lab-result-request.dto';

@Injectable()
export class LabResultRequestsService {
  constructor(
    private prisma: PrismaService,
    private staffResolver: StaffResolverService,
  ) {}

  /** يحل ملف المريض الخاص بحساب مستخدم بدور PATIENT فقط. */
  private async resolveOwnPatientId(userId: string): Promise<string> {
    const own = await this.prisma.patientProfile.findUnique({ where: { userId } });
    if (!own) throw new NotFoundException('لا يوجد ملف مريض مرتبط بهذا الحساب');
    return own.id;
  }

  /**
   * ينشئ طلباً معلّقاً جديداً من نتيجة OCR خام. يُستدعى من OcrController
   * مباشرة بعد استخراج النص - لا يحفظ أي شيء في LabResult، فقط "صندوق وارد"
   * بانتظار مراجعة بشرية.
   */
  async createFromOcr(user: CurrentUserPayload, rawText: string, suggestions: ParsedLabLine[]) {
    const patientId = await this.resolveOwnPatientId(user.userId);

    const patient = await this.prisma.patientProfile.findUnique({
      where: { id: patientId },
      select: { primaryDoctorId: true },
    });
    if (!patient?.primaryDoctorId) {
      throw new NotFoundException(
        'حسابك غير مرتبط بطبيب معالج بعد، لا يمكن إرسال طلب مراجعة تحاليل',
      );
    }

    return this.prisma.labResultRequest.create({
      data: {
        patientId,
        doctorId: patient.primaryDoctorId,
        rawText,
        suggestions: suggestions as unknown as object,
      },
    });
  }

  /** قائمة طلبات المريض نفسه (كل الحالات)، لعرضها في تطبيق الموبايل. */
  async findMine(user: CurrentUserPayload) {
    const patientId = await this.resolveOwnPatientId(user.userId);
    return this.prisma.labResultRequest.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** قائمة الطلبات المعلّقة (أو حسب الحالة المطلوبة) لدى طبيب معيّن. */
  async findForDoctor(user: CurrentUserPayload, status?: LabResultRequestStatus) {
    const doctorId = await this.staffResolver.resolveDoctorId(user);
    return this.prisma.labResultRequest.findMany({
      where: { doctorId, ...(status ? { status } : {}) },
      include: { patient: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async loadOwnedPendingRequest(user: CurrentUserPayload, id: string) {
    const doctorId = await this.staffResolver.resolveDoctorId(user);
    const request = await this.prisma.labResultRequest.findFirst({
      where: { id, doctorId },
    });
    // نفس منطق assertPatientOwnedByDoctor: NotFoundException موحّدة سواء كان
    // الطلب غير موجود أو تابعاً لطبيب آخر - لا نكشف أي معلومة لمهاجم محتمل.
    if (!request) throw new NotFoundException('الطلب غير موجود');
    if (request.status !== LabResultRequestStatus.PENDING) {
      throw new ForbiddenException('تمت مراجعة هذا الطلب مسبقاً');
    }
    return request;
  }

  /**
   * موافقة الطبيب: ينشئ سجلات LabResult فعلية من العناصر التي أكّدها
   * (وقد تكون معدَّلة عن اقتراح OCR الخام)، ثم يُحدّث حالة الطلب.
   * نفس منطق كشف isAbnormal المستخدم في LabResultsService.create.
   */
  async approve(user: CurrentUserPayload, id: string, dto: ApproveLabResultRequestDto) {
    const request = await this.loadOwnedPendingRequest(user, id);

    return this.prisma.$transaction(async (tx) => {
      await tx.labResult.createMany({
        data: dto.items.map((item) => ({
          patientId: request.patientId,
          testName: item.testName,
          value: item.value,
          unit: item.unit,
          normalMin: item.normalMin,
          normalMax: item.normalMax,
          isAbnormal:
            (item.normalMin !== undefined && item.value < item.normalMin) ||
            (item.normalMax !== undefined && item.value > item.normalMax),
        })),
      });

      return tx.labResultRequest.update({
        where: { id: request.id },
        data: { status: LabResultRequestStatus.APPROVED, reviewedAt: new Date() },
      });
    });
  }

  /** رفض الطبيب: لا يُنشئ أي LabResult، فقط يُغلق الطلب مع سبب اختياري. */
  async reject(user: CurrentUserPayload, id: string, dto: RejectLabResultRequestDto) {
    const request = await this.loadOwnedPendingRequest(user, id);

    return this.prisma.labResultRequest.update({
      where: { id: request.id },
      data: {
        status: LabResultRequestStatus.REJECTED,
        reviewNote: dto.note,
        reviewedAt: new Date(),
      },
    });
  }
}
