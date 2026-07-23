import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // حسابات السكرتيرة والمساعد تُنشأ حصراً من طرف الطبيب (عبر /staff)
    // لأنها مرتبطة إلزامياً بطبيب محدد، وليس عبر التسجيل العام.
    if (dto.role === Role.SECRETARY || dto.role === Role.ASSISTANT) {
      throw new BadRequestException(
        'حسابات السكرتيرة والمساعد تُنشأ فقط من طرف الطبيب داخل لوحة التحكم',
      );
    }

    const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existing) {
      throw new ConflictException('رقم الهاتف مسجّل مسبقاً');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    // للمريض: إن كان الطبيب قد سجّله سابقاً (بنفس رقم الهاتف) نربط الحساب
    // الجديد بملفه الطبي الموجود، بدل إنشاء ملف مكرّر بلا سجل طبي.
    let linkedPatientProfileId: string | undefined;
    if (dto.role === Role.PATIENT) {
      const existingProfile = await this.prisma.patientProfile.findFirst({
        where: { phone: dto.phone, userId: null },
      });
      linkedPatientProfileId = existingProfile?.id;
    }

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        email: dto.email,
        passwordHash,
        role: dto.role,
        // إنشاء الملف الشخصي المناسب مباشرة حسب الدور
        doctorProfile:
          dto.role === Role.DOCTOR
            ? { create: { specialty: 'عام' } }
            : undefined,
        patientProfile:
          dto.role === Role.PATIENT
            ? linkedPatientProfileId
              ? { connect: { id: linkedPatientProfileId } }
              : {
                  create: {
                    fullName: dto.fullName,
                    birthDate: new Date('2000-01-01'), // يُطلب تحديثه لاحقاً من الملف الشخصي
                    gender: 'F',
                    phone: dto.phone,
                  },
                }
            : undefined,
      },
      include: { doctorProfile: true, patientProfile: true },
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    return this.buildAuthResponse(user);
  }

  private buildAuthResponse(user: { id: string; role: Role; fullName: string; phone: string }) {
    const payload = { sub: user.id, role: user.role, fullName: user.fullName };
    return {
      accessToken: this.jwt.sign(payload),
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
      },
    };
  }
}
