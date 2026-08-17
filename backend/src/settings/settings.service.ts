import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { StaffResolverService, CurrentUserPayload } from '../common/services/staff-resolver.service';

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private staffResolver: StaffResolverService,
  ) {}

  /** يجمّع كل بيانات مرضى الطبيب في كائن واحد قابل للتصدير كملف JSON */
  async exportBackup(user: CurrentUserPayload) {
    const doctorId = await this.staffResolver.resolveDoctorId(user);

    const patients = await this.prisma.patientProfile.findMany({
      where: { primaryDoctorId: doctorId },
      include: {
        appointments: true,
        medicalRecords: true,
        prescriptions: { include: { items: true } },
        labResults: true,
        invoices: true,
      },
    });

    return {
      exportedAt: new Date().toISOString(),
      doctorId,
      patientsCount: patients.length,
      patients,
    };
  }

  /**
   * حذف كل بيانات مرضى هذا الطبيب (مواعيد، وصفات، تقارير، تحاليل، فواتير)
   * عبر حذف ملفات المرضى أنفسهم (Cascade في قاعدة البيانات يتكفّل بالباقي).
   * لا يمس حساب الطبيب ولا حسابات موظفيه.
   *
   * إجراء لا رجعة فيه (irreversible) على كامل الأرشيف الطبي — لهذا يُطلب
   * إعادة إدخال كلمة المرور الحالية قبل التنفيذ. هذا يحمي من: توكن مسروق/
   * منسي على جهاز مفتوح، نقرة خاطئة، أو استدعاء آلي غير مقصود للـ API.
   */
  async wipeAllPatientData(user: CurrentUserPayload, password: string) {
    const account = await this.prisma.user.findUnique({ where: { id: user.userId } });
    const passwordOk = account && (await bcrypt.compare(password, account.passwordHash));
    if (!passwordOk) {
      throw new UnauthorizedException('كلمة المرور غير صحيحة');
    }

    const doctorId = await this.staffResolver.resolveDoctorId(user);

    const deleted = await this.prisma.patientProfile.deleteMany({
      where: { primaryDoctorId: doctorId },
    });

    return { deletedPatientsCount: deleted.count };
  }
}
