import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedicalReportDto } from './dto/medical-report.dto';

@Injectable()
export class MedicalReportsService {
  constructor(private prisma: PrismaService) {}

  async create(doctorUserId: string, dto: CreateMedicalReportDto) {
    const doctorProfile = await this.getDoctorProfile(doctorUserId);

    // ملاحظة: توليد PDF فعلي (Puppeteer/WeasyPrint) وحفظه على S3 سيُضاف في المرحلة 2
    return this.prisma.medicalReport.create({
      data: {
        patientId: dto.patientId,
        doctorId: doctorProfile.id,
        templateType: dto.templateType,
        examination: dto.examination,
        diagnosis: dto.diagnosis,
        recommendations: dto.recommendations,
        attachments: dto.attachments ?? [],
      },
    });
  }

  async findByPatient(doctorUserId: string, patientId: string) {
    await this.getDoctorProfile(doctorUserId);
    return this.prisma.medicalReport.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async getDoctorProfile(userId: string) {
    const profile = await this.prisma.doctorProfile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException('هذا الحساب ليس حساب طبيب');
    return profile;
  }
}
