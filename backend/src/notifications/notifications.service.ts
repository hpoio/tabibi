import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StaffNotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(
    doctorId: string,
    type: StaffNotificationType,
    title: string,
    message: string,
    relatedId?: string,
  ) {
    try {
      return await this.prisma.staffNotification.create({
        data: { doctorId, type, title, message, relatedId },
      });
    } catch (err) {
      console.error('NotificationsService.create failed:', err);
      return null;
    }
  }

  async existsToday(doctorId: string, type: StaffNotificationType, relatedId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const found = await this.prisma.staffNotification.findFirst({
      where: { doctorId, type, relatedId, createdAt: { gte: startOfDay } },
    });
    return !!found;
  }

  async findMany(doctorId: string, query: { unreadOnly?: boolean; page?: number; pageSize?: number }) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = { doctorId, ...(query.unreadOnly ? { isRead: false } : {}) };

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.staffNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.staffNotification.count({ where }),
      this.prisma.staffNotification.count({ where: { doctorId, isRead: false } }),
    ]);

    return { items, total, page, pageSize, unreadCount };
  }

  async markRead(id: string, doctorId: string) {
    const notif = await this.prisma.staffNotification.findUnique({ where: { id } });
    if (!notif || notif.doctorId !== doctorId) {
      throw new ForbiddenException('هذا الدور لا يملك وصولاً لهذا المورد');
    }
    return this.prisma.staffNotification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(doctorId: string) {
    return this.prisma.staffNotification.updateMany({
      where: { doctorId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
}
