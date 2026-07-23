import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PatientsService } from '../patients/patients.service';

@ApiTags('qr')
@Controller('qr')
export class QrController {
  constructor(private patientsService: PatientsService) {}

  /**
   * مسح رمز QR الخاص بالمريض (من طرف المريض أو الممرض).
   * يعيد فقط: جدول أدوية اليوم + الموعد القادم - دون بيانات طبية حساسة أخرى.
   * محمي بـ rate-limiting صارم (endpoint عام بدون مصادقة، هدف سهل لمحاولات
   * تخمين qrCodeId عبر القوة الغاشمة - UUID عشوائي يجعل هذا شبه مستحيل
   * عملياً، لكن الحد الإضافي طبقة أمان احترازية).
   */
  @Get(':qrCodeId')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  scan(@Param('qrCodeId') qrCodeId: string) {
    return this.patientsService.scanQr(qrCodeId);
  }
}
