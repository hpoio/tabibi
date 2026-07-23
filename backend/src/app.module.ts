import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PatientsModule } from './patients/patients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { QrModule } from './qr/qr.module';
import { MedicalReportsModule } from './medical-reports/medical-reports.module';
import { PdfModule } from './pdf/pdf.module';
import { DrugsModule } from './drugs/drugs.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { LabResultsModule } from './lab-results/lab-results.module';
import { OcrModule } from './ocr/ocr.module';
import { AiModule } from './ai/ai.module';
import { InvoicesModule } from './invoices/invoices.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { MeModule } from './me/me.module';
import { StaffModule } from './staff/staff.module';
import { SettingsModule } from './settings/settings.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { AuditLogService } from './common/services/audit-log.service';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    NotificationsModule,
    ConfigModule.forRoot({ isGlobal: true }),
    // حماية عامة من إساءة الاستخدام: 60 طلباً كحد أقصى لكل 60 ثانية لكل IP.
    // نقاط أكثر حساسية (auth, qr) لها حدود أكثر صرامة عبر @Throttle محلياً.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    PrismaModule,
    AuthModule,
    PatientsModule,
    AppointmentsModule,
    QrModule,
    MedicalReportsModule,
    PdfModule,
    DrugsModule,
    PrescriptionsModule,
    LabResultsModule,
    OcrModule,
    AiModule,
    InvoicesModule,
    ConsultationsModule,
    AnalyticsModule,
    MeModule,
    StaffModule,
    SettingsModule,
    AuditLogsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
    AuditLogService,
  ],
})
export class AppModule {}
