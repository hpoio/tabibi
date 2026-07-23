import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConsultationDto, ReplyConsultationDto } from './dto/consultation.dto';

@Injectable()
export class ConsultationsService {
  constructor(private prisma: PrismaService) {}

  async create(doctorUserId: string, dto: CreateConsultationDto) {
    const doctorProfile = await this.getDoctorProfile(doctorUserId);

    return this.prisma.consultation.create({
      data: {
        requesterId: doctorProfile.id,
        caseText: dto.caseText,
        caseAnonymized: dto.caseAnonymized ?? true,
      },
    });
  }

  /** لوحة الاستشارات المفتوحة (لكل الأطباء - شبكة تعاون) */
  async findOpen() {
    return this.prisma.consultation.findMany({
      include: {
        requester: { select: { specialty: true, user: { select: { fullName: true } } } },
        replies: {
          include: { doctor: { select: { user: { select: { fullName: true } } } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  async findMine(doctorUserId: string) {
    const doctorProfile = await this.getDoctorProfile(doctorUserId);
    return this.prisma.consultation.findMany({
      where: { requesterId: doctorProfile.id },
      include: { replies: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reply(doctorUserId: string, consultationId: string, dto: ReplyConsultationDto) {
    const doctorProfile = await this.getDoctorProfile(doctorUserId);

    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
    });
    if (!consultation) throw new NotFoundException('الاستشارة غير موجودة');

    return this.prisma.consultationReply.create({
      data: {
        consultationId,
        doctorId: doctorProfile.id,
        replyText: dto.replyText,
      },
    });
  }

  private async getDoctorProfile(userId: string) {
    const profile = await this.prisma.doctorProfile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException('هذا الحساب ليس حساب طبيب');
    return profile;
  }
}
