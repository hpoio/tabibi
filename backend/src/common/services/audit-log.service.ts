import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditLogEntry {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress?: string;
  userAgent?: string;
  oldValue?: unknown;
  newValue?: unknown;
}

export interface AuditLogQuery {
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

/**
 * خدمة مركزية لكتابة وقراءة سجل العمليات. الكتابة تُستدعى تلقائياً من
 * AuditLogInterceptor دون أي تعديل على كود الخدمات الحالية.
 */
@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async record(entry: AuditLogEntry) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: entry.userId,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          oldValue: entry.oldValue as any,
          newValue: entry.newValue as any,
        },
      });
    } catch {
      // فشل تسجيل السجل لا يجب أن يُسقط الطلب الأصلي أبداً
    }
  }

  async findMany(doctorUserId: string, query: AuditLogQuery) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : 20;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { action: { contains: query.search, mode: 'insensitive' } },
        { entityType: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { user: { select: { fullName: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }
}
