import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { StaffResolverService, CurrentUserPayload } from '../common/services/staff-resolver.service';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto/appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private staffResolver: StaffResolverService,
    private notifications: NotificationsService,
  ) {}

  async create(user: CurrentUserPayload, dto: CreateAppointmentDto) {
    const doctorId = await this.staffResolver.resolveDoctorId(user);
    await this.staffResolver.assertPatientOwnedByDoctor(doctorId, dto.patientId);

    return this.prisma.appointment.create({
      data: {
        doctorId,
        patientId: dto.patientId,
        type: dto.type,
        scheduledAt: new Date(dto.scheduledAt),
        durationMin: dto.durationMin ?? 20,
        notes: dto.notes,
      },
    });
  }

  /** تقويم العيادة: كل المواعيد بين تاريخين، مع بيانات المريض */
  async findByRange(user: CurrentUserPayload, from: string, to: string) {
    const doctorId = await this.staffResolver.resolveDoctorId(user);

    return this.prisma.appointment.findMany({
      where: {
        doctorId,
        scheduledAt: { gte: new Date(from), lte: new Date(to) },
      },
      include: { patient: { select: { id: true, fullName: true, phone: true } } },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  /** مواعيد اليوم - تُستخدم في لوحة تحكم الطبيب مباشرة عند الدخول */
  async findToday(user: CurrentUserPayload) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return this.findByRange(user, start.toISOString(), end.toISOString());
  }

  async update(user: CurrentUserPayload, appointmentId: string, dto: UpdateAppointmentDto) {
    const doctorId = await this.staffResolver.resolveDoctorId(user);

    // أمان (SEC-016): كان الاعتماد سابقاً فقط على where المركّب
    // {id, doctorId} في update() مباشرة - العزل الأمني كان يعمل فعلياً
    // (Prisma يرفض التحديث إن لم يتطابق doctorId)، لكن الخطأ الناتج
    // (PrismaClientKnownRequestError P2025) لم يكن مُعالَجاً، فيسقط
    // كخطأ عام 500 بدل رسالة نظيفة 404 - نفس نمط invoices.service.ts.
    const existing = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, doctorId },
    });
    if (!existing) throw new NotFoundException('الموعد غير موجود');

    const appointment = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.scheduledAt ? { scheduledAt: new Date(dto.scheduledAt) } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
      include: { patient: { select: { fullName: true } } },
    });

    if (dto.status === 'CANCELLED') {
      this.notifications
        .create(doctorId, 'APPOINTMENT_CANCELLED', 'إلغاء موعد', `تم إلغاء موعد: ${appointment.patient?.fullName ?? ''}`, appointment.id)
        .catch(() => {});
    }

    return appointment;
  }
}
