import { Injectable, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface CurrentUserPayload {
  userId: string;
  role: Role;
  fullName: string;
}

@Injectable()
export class StaffResolverService {
  constructor(private prisma: PrismaService) {}

  async resolveDoctorId(user: CurrentUserPayload): Promise<string> {
    if (user.role === Role.DOCTOR) {
      const doctorProfile = await this.prisma.doctorProfile.findUnique({
        where: { userId: user.userId },
      });
      if (!doctorProfile) throw new ForbiddenException('هذا الحساب ليس حساب طبيب');
      return doctorProfile.id;
    }

    if (user.role === Role.SECRETARY) {
      const secretaryProfile = await this.prisma.secretaryProfile.findUnique({
        where: { userId: user.userId },
      });
      if (!secretaryProfile) throw new ForbiddenException('هذا الحساب غير مرتبط بأي طبيب');
      return secretaryProfile.doctorId;
    }

    if (user.role === Role.ASSISTANT) {
      const assistantProfile = await this.prisma.assistantProfile.findUnique({
        where: { userId: user.userId },
      });
      if (!assistantProfile) throw new ForbiddenException('هذا الحساب غير مرتبط بأي طبيب');
      return assistantProfile.doctorId;
    }

    throw new ForbiddenException('هذا الدور لا يملك وصولاً لهذا المورد');
  }
}
