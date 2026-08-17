import { Body, Controller, Post, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from './ai.service';
import { DiagnosisAssistDto, PatientChatDto } from './dto/ai.dto';
import { containsEmergencyKeyword, EMERGENCY_RESPONSE_AR } from './emergency-keywords';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai')
export class AiController {
  constructor(
    private aiService: AiService,
    private prisma: PrismaService,
  ) {}

  /** تشخيص مساعد - للطبيب فقط، لا يتصل به المريض أبداً */
  @Post('diagnosis-assist')
  @Roles(Role.DOCTOR)
  // حماية تكلفة الـ API: كل استدعاء يستهلك رصيداً حقيقياً من Anthropic
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  diagnosisAssist(@Body() dto: DiagnosisAssistDto) {
    return this.aiService.getDiagnosisAssist(dto.caseText);
  }

  /**
   * شات المريض. تدفق الأمان (بالترتيب):
   * 1) فحص محلي فوري لكلمات طوارئ (مستقل عن الذكاء الاصطناعي) → تصعيد فوري بدون انتظار AI.
   * 2) استدعاء AiService (يطلب من النموذج نفسه تقييم escalate ضمن الـ JSON).
   * 3) حفظ كل الرسائل (مريض + رد) في AiChatMessage دائماً، وإنشاء Notification
   *    للطبيب عند أي تصعيد (من الخطوة 1 أو 2).
   */
  @Post('chat')
  @Roles(Role.PATIENT, Role.DOCTOR)
  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  async chat(@CurrentUser() user, @Body() dto: PatientChatDto) {
    // أمان: إن كان المتصل مريضاً، يُجبَر patientId على حسابه الخاص فقط -
    // لا يُسمح أبداً بأن يرسل مريض رسالة نيابة عن patientId مختلف.
    let patientId = dto.patientId;
    if (user.role === Role.PATIENT) {
      const own = await this.prisma.patientProfile.findUnique({ where: { userId: user.userId } });
      if (!own) throw new NotFoundException('لا يوجد ملف مريض مرتبط بهذا الحساب');
      patientId = own.id;
    }
    if (!patientId) {
      throw new BadRequestException('patientId مطلوب عند الاستدعاء نيابة عن مريض');
    }

    const patient = await this.prisma.patientProfile.findUnique({
      where: { id: patientId },
    });
    if (!patient) throw new NotFoundException('المريض غير موجود');

    await this.prisma.aiChatMessage.create({
      data: { patientId, sender: 'patient', message: dto.message },
    });

    // الحارس الأول: فحص نصي محلي، لا يعتمد على استجابة النموذج إطلاقاً
    if (containsEmergencyKeyword(dto.message)) {
      await this.persistReplyAndEscalate(
        patientId,
        EMERGENCY_RESPONSE_AR,
        'كلمة مفتاحية طارئة في رسالة المريض',
      );
      return { reply: EMERGENCY_RESPONSE_AR, escalate: true };
    }

    // الحارس الثاني: تقييم النموذج نفسه
    const recentHistory = await this.prisma.aiChatMessage.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });
    const historyText = recentHistory
      .reverse()
      .map((m) => `${m.sender}: ${m.message}`)
      .join('\n');

    const result = await this.aiService.chatWithPatient(dto.message, historyText);

    if (result.escalate) {
      await this.persistReplyAndEscalate(patientId, result.reply, result.escalateReason);
    } else {
      await this.prisma.aiChatMessage.create({
        data: { patientId, sender: 'ai', message: result.reply },
      });
    }

    return result;
  }

  private async persistReplyAndEscalate(patientId: string, reply: string, reason?: string) {
    await this.prisma.aiChatMessage.create({
      data: { patientId, sender: 'ai', message: reply, escalated: true },
    });
    await this.prisma.notification.create({
      data: {
        patientId,
        type: 'AI_CHAT_ESCALATION',
        message: `تصعيد من شات المريض: ${reason ?? 'غير محدد'}`,
      },
    });
  }
}
