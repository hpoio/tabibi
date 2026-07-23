import { Injectable, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/staff.dto';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async create(doctorUserId: string, dto: CreateStaffDto) {
    if (dto.role !== Role.SECRETARY && dto.role !== Role.ASSISTANT) {
      throw new BadRequestException('الدور يجب أن يكون سكرتيرة أو مساعد فقط');
    }

    const doctorProfile = await this.prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    });
    if (!doctorProfile) throw new ForbiddenException('هذا الحساب ليس حساب طبيب');

    const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existing) throw new ConflictException('رقم الهاتف مسجّل مسبقاً');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        passwordHash,
        role: dto.role,
        secretaryProfile:
          dto.role === Role.SECRETARY
            ? { create: { doctorId: doctorProfile.id } }
            : undefined,
        assistantProfile:
          dto.role === Role.ASSISTANT
            ? { create: { doctorId: doctorProfile.id } }
            : undefined,
      },
      select: { id: true, fullName: true, phone: true, role: true, createdAt: true },
    });

    return user;
  }

  async findAll(doctorUserId: string) {
    const doctorProfile = await this.prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    });
    if (!doctorProfile) throw new ForbiddenException('هذا الحساب ليس حساب طبيب');

    const secretaries = await this.prisma.secretaryProfile.findMany({
      where: { doctorId: doctorProfile.id },
      include: { user: { select: { id: true, fullName: true, phone: true, isActive: true, createdAt: true } } },
    });

    const assistants = await this.prisma.assistantProfile.findMany({
      where: { doctorId: doctorProfile.id },
      include: { user: { select: { id: true, fullName: true, phone: true, isActive: true, createdAt: true } } },
    });

    return [
      ...secretaries.map((s) => ({ ...s.user, role: Role.SECRETARY })),
      ...assistants.map((a) => ({ ...a.user, role: Role.ASSISTANT })),
    ];
  }
}
