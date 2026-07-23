import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { StaffNotificationType } from '@prisma/client';

@Injectable()
export class NotificationsCronService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  @Cron('0 7 * * *')
  async handleDailyNotifications() {
    await this.notifyAppointments(0, 'APPOINTMENT_TODAY', 'موعد اليوم');
    await this.notifyAppointments(1, 'APPOINTMENT_TOMORROW', 'موعد غداً');
    await this.notifyUnpaidInvoices();
  }

  private async notifyAppointments(daysAhead: number, type: StaffNotificationType, label: string) {
    const target = new Date();
    target.setDate(target.getDate() + daysAhead);
    target.setHours(0, 0, 0, 0);
    const nextDay = new Date(target);
    nextDay.setDate(nextDay.getDate() + 1);

    const appointments = await this.prisma.appointment.findMany({
      where: { scheduledAt: { gte: target, lt: nextDay }, status: { not: 'CANCELLED' } },
      include: { patient: true },
    });

    for (const appt of appointments) {
      const already = await this.notifications.existsToday(appt.doctorId, type, appt.id);
      if (already) continue;
      await this.notifications.create(
        appt.doctorId,
        type,
        label,
        `${label}: ${appt.patient?.fullName ?? 'مريض'}`,
        appt.id,
      );
    }
  }

  private async notifyUnpaidInvoices() {
    const unpaid = await this.prisma.invoice.findMany({
      where: { status: 'UNPAID' },
      include: { patient: true },
    });

    for (const inv of unpaid) {
      const doctorId = inv.patient?.primaryDoctorId;
      if (!doctorId) continue; // المريض بلا طبيب مسؤول محدد، تجاهله

      const already = await this.notifications.existsToday(doctorId, 'INVOICE_UNPAID', inv.id);
      if (already) continue;
      await this.notifications.create(
        doctorId,
        'INVOICE_UNPAID',
        'فاتورة غير مسددة',
        `فاتورة بمبلغ ${inv.amount} غير مسددة للمريض ${inv.patient?.fullName ?? ''}`,
        inv.id,
      );
    }
  }
}
