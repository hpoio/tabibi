import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLabResultDto } from './dto/lab-result.dto';

@Injectable()
export class LabResultsService {
  constructor(private prisma: PrismaService) {}

  async create(doctorUserId: string, dto: CreateLabResultDto) {
    await this.getDoctorProfile(doctorUserId);

    const patient = await this.prisma.patientProfile.findUnique({ where: { id: dto.patientId } });
    if (!patient) throw new NotFoundException('المريض غير موجود');

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
  async findByPatient(doctorUserId: string, patientId: string, testName?: string) {
    await this.getDoctorProfile(doctorUserId);
    return this.prisma.labResult.findMany({
      where: { patientId, ...(testName ? { testName } : {}) },
      orderBy: { takenAt: 'asc' },
    });
  }

  /** كل النتائج غير الطبيعية لدى مرضى هذا الطبيب - تُغذّي تنبيهات لوحة التحكم */
  async findAbnormalForDoctor(doctorUserId: string) {
    const doctorProfile = await this.getDoctorProfile(doctorUserId);
    return this.prisma.labResult.findMany({
      where: { isAbnormal: true, patient: { primaryDoctorId: doctorProfile.id } },
      include: { patient: { select: { fullName: true } } },
      orderBy: { takenAt: 'desc' },
      take: 20,
    });
  }

  private async getDoctorProfile(userId: string) {
    const profile = await this.prisma.doctorProfile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException('هذا الحساب ليس حساب طبيب');
    return profile;
  }
}
