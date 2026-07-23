import { Injectable, ForbiddenException } from '@nestjs/common';
import { InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(doctorUserId: string) {
    const doctorProfile = await this.getDoctorProfile(doctorUserId);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [totalPatients, appointmentsThisMonth, revenueThisMonth, unpaidCount, appointmentsByType] =
      await Promise.all([
        this.prisma.patientProfile.count({ where: { primaryDoctorId: doctorProfile.id } }),

        this.prisma.appointment.count({
          where: { doctorId: doctorProfile.id, scheduledAt: { gte: startOfMonth } },
        }),

        this.prisma.invoice.aggregate({
          where: {
            patient: { primaryDoctorId: doctorProfile.id },
            status: InvoiceStatus.PAID,
            paidAt: { gte: startOfMonth },
          },
          _sum: { amount: true },
        }),

        this.prisma.invoice.count({
          where: {
            patient: { primaryDoctorId: doctorProfile.id },
            status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.LATE] },
          },
        }),

        this.prisma.appointment.groupBy({
          by: ['type'],
          where: { doctorId: doctorProfile.id, scheduledAt: { gte: startOfMonth } },
          _count: true,
        }),
      ]);

    return {
      totalPatients,
      appointmentsThisMonth,
      revenueThisMonth: revenueThisMonth._sum.amount ?? 0,
      unpaidInvoicesCount: unpaidCount,
      appointmentsByType: appointmentsByType.map((a) => ({ type: a.type, count: a._count })),
    };
  }

  private async getDoctorProfile(userId: string) {
    const profile = await this.prisma.doctorProfile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException('هذا الحساب ليس حساب طبيب');
    return profile;
  }
}
