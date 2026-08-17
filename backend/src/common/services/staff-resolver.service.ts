import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface CurrentUserPayload {
  userId: string;
  role: Role;
  fullName: string;
}

@Injectable()
export class StaffResolverService {
  constructor(private prisma: PrismaService) {}

  async resolveDoctorId(user: CurrentUserPayload): Promise<string> {
    if (user.role === Role.DOCTOR) {
      const doctorProfile = await this.prisma.doctorProfile.findUnique({
        where: { userId: user.userId },
      });
      if (!doctorProfile) throw new ForbiddenException('هذا الحساب ليس حساب طبيب');
      return doctorProfile.id;
    }

    if (user.role === Role.SECRETARY) {
      const secretaryProfile = await this.prisma.secretaryProfile.findUnique({
        where: { userId: user.userId },
      });
      if (!secretaryProfile) throw new ForbiddenException('هذا الحساب غير مرتبط بأي طبيب');
      return secretaryProfile.doctorId;
    }

    if (user.role === Role.ASSISTANT) {
      const assistantProfile = await this.prisma.assistantProfile.findUnique({
        where: { userId: user.userId },
      });
      if (!assistantProfile) throw new ForbiddenException('هذا الحساب غير مرتبط بأي طبيب');
      return assistantProfile.doctorId;
    }

    throw new ForbiddenException('هذا الدور لا يملك وصولاً لهذا المورد');
  }

  /**
   * يتحقق أن المريض المطلوب هو فعلاً مريض هذا الطبيب (وليس مريض طبيب آخر).
   * إلزامي قبل أي قراءة أو كتابة لبيانات طبية مرتبطة بمريض (وصفات، تحاليل،
   * فواتير، تقارير) — بدونه أي طبيب مسجَّل في النظام يقدر يصل لبيانات
   * مرضى طبيب آخر لمجرد معرفة أو تخمين الـ patientId (ثغرة IDOR).
   *
   * نستخدم NotFoundException (وليس ForbiddenException) عمداً: نفس رسالة
   * الخطأ سواء كان المريض غير موجود أصلاً أو موجوداً عند طبيب آخر، حتى لا
   * نؤكد لمهاجم محتمل أن الـ patientId الذي جرّبه صحيح فعلاً.
   */
  async assertPatientOwnedByDoctor(doctorId: string, patientId: string): Promise<void> {
    const patient = await this.prisma.patientProfile.findFirst({
      where: { id: patientId, primaryDoctorId: doctorId },
      select: { id: true },
    });
    if (!patient) {
      throw new NotFoundException('المريض غير موجود');
    }
  }
}
