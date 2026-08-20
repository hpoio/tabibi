import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

// مدة صلاحية الـ Refresh Token (بالأيام) — أطول من الـ access token
// لأنه هو المسؤول عن "تذكّرني" دون إعادة تسجيل الدخول كل مرة.
const REFRESH_TOKEN_DAYS = 30;

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

    // ⚠️ أمان (SEC-014): سابقاً كان يُربط الحساب الجديد تلقائياً بأي
    // PatientProfile موجود بنفس رقم الهاتف (سجّله طبيب سابقاً) بدون أي
    // تحقق ملكية - هذا كان يسمح لأي شخص يعرف رقم هاتف مريض بانتحال هويته
    // والوصول الفوري لكامل سجله الطبي (مواعيد، وصفات، تحاليل، فواتير).
    // تم تعطيل الربط التلقائي: كل تسجيل مريض جديد ينشئ ملفاً مستقلاً.
    // ربط حساب مريض موجود مسبقاً بملفه الطبي القديم يجب أن يمر عبر تحقق
    // هوية فعلي (مثال: OTP عبر SMS أو تأكيد من الطبيب) - ميزة لاحقة مخطط
    // لها، وليست جزءاً من هذا الإصلاح الأمني الحد الأدنى.
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
            ? {
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

  /**
   * يستبدل refresh token صالحاً بزوج جديد (access + refresh) ويُلغي القديم فوراً.
   * هذا "التدوير" (rotation) يعني أن أي محاولة لإعادة استخدام توكن قديم مُستهلَك
   * تفشل تلقائياً — وهي إشارة قوية على أن التوكن تسرّب واستُخدم من طرفين.
   */
  async refresh(rawRefreshToken: string) {
    const tokenHash = this.hashToken(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date() || !stored.user.isActive) {
      throw new UnauthorizedException('جلسة غير صالحة، الرجاء تسجيل الدخول من جديد');
    }

    // إلغاء التوكن الحالي فوراً (تدوير إلزامي عند كل استخدام)
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.buildAuthResponse(stored.user);
  }

  /** إلغاء refresh token واحد (تسجيل خروج من هذا الجهاز فقط) */
  async logout(rawRefreshToken: string) {
    const tokenHash = this.hashToken(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  /** إلغاء كل جلسات المستخدم على كل الأجهزة (عند تغيير كلمة المرور مثلاً، أو اشتباه اختراق) */
  async logoutAllDevices(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  private hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  private async buildAuthResponse(user: { id: string; role: Role; fullName: string; phone: string }) {
    const payload = { sub: user.id, role: user.role, fullName: user.fullName };
    const accessToken = this.jwt.sign(payload);

    // Refresh token: سلسلة عشوائية مستقلة عن JWT، لا تُخزَّن أبداً بنص صريح في القاعدة
    const rawRefreshToken = crypto.randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: this.hashToken(rawRefreshToken), expiresAt },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
      },
    };
  }
}
