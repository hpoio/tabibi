import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StaffResolverService, CurrentUserPayload } from '../common/services/staff-resolver.service';
import { CreateLabResultDto } from './dto/lab-result.dto';

@Injectable()
export class LabResultsService {
  constructor(
    private prisma: PrismaService,
    private staffResolver: StaffResolverService,
  ) {}

  async create(user: CurrentUserPayload, dto: CreateLabResultDto) {
    const doctorId = await this.staffResolver.resolveDoctorId(user);
    await this.staffResolver.assertPatientOwnedByDoctor(doctorId, dto.patientId);

    // كشف تلقائي: القيمة غير طبيعية إذا خرجت عن المجال الطبيعي المُدخل
    const isAbnormal =
      (dto.normalMin !== undefined && dto.value < dto.normalMin) ||
      (dto.normalMax !== undefined && dto.value > dto.normalMax);

    return this.prisma.labResult.create({
      data: {
        patientId: dto.patientId,
        testName: dto.testName,
        value: dto.value,
        unit: dto.unit,
        normalMin: dto.normalMin,
        normalMax: dto.normalMax,
        isAbnormal,
        takenAt: dto.takenAt ? new Date(dto.takenAt) : new Date(),
      },
    });
  }

  /** سجل كل التحاليل لمريض معيّن (يُستخدم أيضاً لرسم منحنى تطور القيمة عبر الزمن) */
  async findByPatient(user: CurrentUserPayload, patientId: string, testName?: string) {
    const doctorId = await this.staffResolver.resolveDoctorId(user);
    await this.staffResolver.assertPatientOwnedByDoctor(doctorId, patientId);

    return this.prisma.labResult.findMany({
      where: { patientId, ...(testName ? { testName } : {}) },
      orderBy: { takenAt: 'asc' },
    });
  }

  /** كل النتائج غير الطبيعية لدى مرضى هذا الطبيب - تُغذّي تنبيهات لوحة التحكم */
  async findAbnormalForDoctor(user: CurrentUserPayload) {
    const doctorId = await this.staffResolver.resolveDoctorId(user);
    return this.prisma.labResult.findMany({
      where: { isAbnormal: true, patient: { primaryDoctorId: doctorId } },
      include: { patient: { select: { fullName: true } } },
      orderBy: { takenAt: 'desc' },
      take: 20,
    });
  }
}
