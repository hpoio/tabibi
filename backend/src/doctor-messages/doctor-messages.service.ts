import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/doctor-messages.dto';

@Injectable()
export class DoctorMessagesService {
  constructor(private prisma: PrismaService) {}

  private async getDoctorProfile(userId: string) {
    const profile = await this.prisma.doctorProfile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException('هذا الحساب ليس حساب طبيب');
    return profile;
  }

  /** قائمة كل الأطباء (لبدء محادثة جديدة)، باستثناء الطبيب نفسه */
  async listDoctors(doctorUserId: string) {
    const me = await this.getDoctorProfile(doctorUserId);
    return this.prisma.doctorProfile.findMany({
      where: { id: { not: me.id } },
      select: {
        id: true,
        specialty: true,
        clinicName: true,
        user: { select: { fullName: true } },
      },
      orderBy: { user: { fullName: 'asc' } },
    });
  }

  /** إرسال رسالة جديدة */
  async send(doctorUserId: string, dto: SendMessageDto) {
    const me = await this.getDoctorProfile(doctorUserId);

    const receiver = await this.prisma.doctorProfile.findUnique({
      where: { id: dto.receiverId },
    });
    if (!receiver) throw new NotFoundException('الطبيب المستقبل غير موجود');

    return this.prisma.doctorMessage.create({
      data: {
        senderId: me.id,
        receiverId: dto.receiverId,
        content: dto.content,
      },
    });
  }

  /**
   * قائمة المحادثات: طبيب واحد لكل محادثة، مع آخر رسالة وعدد غير المقروء.
   * نجمع الرسائل يدوياً بدل استخدام groupBy لأن العلاقة ثنائية الاتجاه
   * (أنا المرسل أو أنا المستقبل) وهذا أوضح وأسهل صيانة من استعلام مركّب.
   */
  async listConversations(doctorUserId: string) {
    const me = await this.getDoctorProfile(doctorUserId);

    const messages = await this.prisma.doctorMessage.findMany({
      where: { OR: [{ senderId: me.id }, { receiverId: me.id }] },
      include: {
        sender: { select: { id: true, specialty: true, user: { select: { fullName: true } } } },
        receiver: { select: { id: true, specialty: true, user: { select: { fullName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const conversationsMap = new Map<string, any>();
    for (const msg of messages) {
      const otherDoctor = msg.senderId === me.id ? msg.receiver : msg.sender;
      if (!conversationsMap.has(otherDoctor.id)) {
        conversationsMap.set(otherDoctor.id, {
          doctor: otherDoctor,
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
          unreadCount: 0,
        });
      }
      const conv = conversationsMap.get(otherDoctor.id);
      if (msg.receiverId === me.id && !msg.readAt) {
        conv.unreadCount += 1;
      }
    }

    return Array.from(conversationsMap.values()).sort(
      (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime(),
    );
  }

  /** كل رسائل محادثة مع طبيب معيّن، مرتبة زمنياً */
  async getConversation(doctorUserId: string, otherDoctorId: string) {
    const me = await this.getDoctorProfile(doctorUserId);

    return this.prisma.doctorMessage.findMany({
      where: {
        OR: [
          { senderId: me.id, receiverId: otherDoctorId },
          { senderId: otherDoctorId, receiverId: me.id },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** تعليم كل رسائل محادثة معيّنة كمقروءة */
  async markAsRead(doctorUserId: string, otherDoctorId: string) {
    const me = await this.getDoctorProfile(doctorUserId);

    await this.prisma.doctorMessage.updateMany({
      where: { senderId: otherDoctorId, receiverId: me.id, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  }

  /** إجمالي عدد الرسائل غير المقروءة (لشارة الإشعارات) */
  async unreadCount(doctorUserId: string) {
    const me = await this.getDoctorProfile(doctorUserId);
    const count = await this.prisma.doctorMessage.count({
      where: { receiverId: me.id, readAt: null },
    });
    return { count };
  }
}
