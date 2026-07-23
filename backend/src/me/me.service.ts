import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MeService {
  constructor(private prisma: PrismaService) {}

  private async getPatientProfile(userId: string) {
    const profile = await this.prisma.patientProfile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException('هذا الحساب ليس حساب مريض');
    return profile;
  }

  async getProfile(userId: string) {
    return this.getPatientProfile(userId);
  }

  async getUpcomingAppointments(userId: string) {
    const patient = await this.getPatientProfile(userId);
    return this.prisma.appointment.findMany({
      where: { patientId: patient.id, scheduledAt: { gte: new Date() } },
      include: { doctor: { select: { specialty: true, clinicName: true, user: { select: { fullName: true } } } } },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async getPrescriptions(userId: string) {
    const patient = await this.getPatientProfile(userId);
    return this.prisma.prescription.findMany({
      where: { patientId: patient.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLabResults(userId: string) {
    const patient = await this.getPatientProfile(userId);
    return this.prisma.labResult.findMany({
      where: { patientId: patient.id },
      orderBy: { takenAt: 'desc' },
    });
  }

  async getInvoices(userId: string) {
    const patient = await this.getPatientProfile(userId);
    return this.prisma.invoice.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getChatHistory(userId: string) {
    const patient = await this.getPatientProfile(userId);
    return this.prisma.aiChatMessage.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
  }
}
