import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

export interface DiagnosisAssistResult {
  suggestionsText: string;
  disclaimer: string;
}

export interface PatientChatResult {
  reply: string;
  escalate: boolean;
  escalateReason?: string;
}

const DIAGNOSIS_DISCLAIMER =
  'هذه اقتراحات أولية لأغراض المساعدة فقط وليست تشخيصاً نهائياً. ' +
  'القرار الطبي والمسؤولية الكاملة تعود للطبيب المعالج بناءً على فحصه السريري.';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private client: Anthropic | null = null;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
    } else {
      this.logger.warn(
        'ANTHROPIC_API_KEY غير مضبوط — وحدة الذكاء الاصطناعي لن تعمل حتى تضيفه في .env',
      );
    }
  }

  private get model(): string {
    return this.config.get<string>('AI_MODEL', 'claude-sonnet-5');
  }

  /**
   * تشخيص مساعد للطبيب فقط (endpoint محمي بـ Role.DOCTOR).
   * المدخل يجب أن يكون معلومات الحالة (أعراض/فحص/سوابق) — يُفضّل
   * إخفاء اسم المريض الصريح عند الإرسال إن أمكن (خصوصية إضافية).
   */
  async getDiagnosisAssist(caseText: string): Promise<DiagnosisAssistResult> {
    if (!this.client) {
      throw new Error('ANTHROPIC_API_KEY غير مُهيّأ في هذا السيرفر');
    }

    const systemPrompt = `أنت مساعد سريري يعمل حصرياً لدعم طبيب مرخّص أثناء عمله، ولست تتحدث مع المريض مباشرة أبداً.
مهمتك: اقتراح قائمة تشخيصات تفريقية محتملة (differential diagnosis) بناءً على المعطيات السريرية المُدخلة من الطبيب، مع أهم الفحوصات/التحاليل المقترحة للتمييز بينها.
قواعد صارمة:
- لا تقدّم أبداً "تشخيصاً نهائياً" — فقط احتمالات مرتبة مع درجة الثقة النسبية والمنطق السريري وراء كل احتمال.
- إن كانت المعطيات تشير لاحتمال حالة خطيرة/طارئة، اذكر ذلك بوضوح في أول السطر.
- لا تقترح جرعات أدوية دقيقة نهائياً — هذا قرار الطبيب حصراً.
- أجب بالعربية الفصحى الواضحة، بصيغة نقاط مختصرة وقابلة للمسح السريع.`;

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: caseText }],
    });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n');

    return { suggestionsText: text, disclaimer: DIAGNOSIS_DISCLAIMER };
  }

  /**
   * شات المريض. يُستدعى فقط بعد أن يتخطى الفحص المحلي للكلمات الطارئة
   * (containsEmergencyKeyword) في الـ controller — راجع emergency-keywords.ts.
   * يطلب من النموذج إخراج JSON منظّم للتمكن من قراءة escalate برمجياً،
   * لكن هذا احتياطي إضافي فقط، وليس الحارس الوحيد (الحارس الأساسي نصي محلي).
   */
  async chatWithPatient(patientMessage: string, historyText: string): Promise<PatientChatResult> {
    if (!this.client) {
      throw new Error('ANTHROPIC_API_KEY غير مُهيّأ في هذا السيرفر');
    }

    const systemPrompt = `أنت مساعد صحي رقمي يتحدث مباشرة مع مريض (وليس طبيباً). دورك محدود جداً وواضح:
- تقديم توجيه صحي عام وطمأنة أولية فقط.
- ممنوع منعاً باتاً: تشخيص حالة المريض، أو اقتراح دواء أو جرعة، أو الإيحاء بأن حالته بسيطة إن وصف أعراضاً قد تكون خطيرة.
- في أي شك، وجّه المريض بوضوح لحجز موعد أو التواصل مع طبيبه.
- إن كانت الرسالة تحمل أي إشارة لخطر فوري (ألم شديد، صعوبة تنفس، أفكار إيذاء النفس، إلخ) اجعل escalate=true فوراً.
أجب حصراً بصيغة JSON بالضبط بهذا الشكل، بدون أي نص خارج الـ JSON:
{"reply": "نص الرد بالعربية", "escalate": true أو false, "escalateReason": "سبب مختصر أو null"}`;

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        ...(historyText ? [{ role: 'user' as const, content: `سياق سابق:\n${historyText}` }] : []),
        { role: 'user', content: patientMessage },
      ],
    });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');

    try {
      const parsed = JSON.parse(text);
      return {
        reply: parsed.reply ?? text,
        escalate: Boolean(parsed.escalate),
        escalateReason: parsed.escalateReason ?? undefined,
      };
    } catch {
      // إن فشل تحليل JSON (النموذج قد يخرج نصاً غير منظم أحياناً)، نُعامل الأمر
      // بحذر: نعرض الرد كنص خام ونصعّد احتياطياً بدل تجاهل خطأ التحليل بصمت
      this.logger.warn('فشل تحليل رد JSON من النموذج - سيتم التصعيد احتياطاً');
      return { reply: text, escalate: true, escalateReason: 'فشل تحليل رد النموذج - تصعيد احتياطي' };
    }
  }
}
