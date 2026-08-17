import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StaffResolverService, CurrentUserPayload } from '../common/services/staff-resolver.service';
import { CreateMedicalReportDto } from './dto/medical-report.dto';

@Injectable()
export class MedicalReportsService {
  constructor(
    private prisma: PrismaService,
    private staffResolver: StaffResolverService,
  ) {}

  async create(user: CurrentUserPayload, dto: CreateMedicalReportDto) {
    const doctorId = await this.staffResolver.resolveDoctorId(user);
    await this.staffResolver.assertPatientOwnedByDoctor(doctorId, dto.patientId);

    // ملاحظة: توليد PDF فعلي (Puppeteer/WeasyPrint) وحفظه على S3 سيُضاف في المرحلة 2
    return this.prisma.medicalReport.create({
      data: {
        patientId: dto.patientId,
        doctorId,
        templateType: dto.templateType,
        examination: dto.examination,
        diagnosis: dto.diagnosis,
        recommendations: dto.recommendations,
        attachments: dto.attachments ?? [],
      },
    });
  }

  async findByPatient(user: CurrentUserPayload, patientId: string) {
    const doctorId = await this.staffResolver.resolveDoctorId(user);
    await this.staffResolver.assertPatientOwnedByDoctor(doctorId, patientId);

    return this.prisma.medicalReport.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
