import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

// حدود الطول: تحمي من استنزاف تكلفة Anthropic API ومن هجمات DoS عبر
// إرسال نصوص ضخمة، مع ترك مساحة كافية لوصف حالة سريرية كاملة بالعربية.
const CASE_TEXT_MAX_LENGTH = 4000;
const CHAT_MESSAGE_MAX_LENGTH = 2000;

export class DiagnosisAssistDto {
  @IsString()
  @MinLength(10, { message: 'الوصف قصير جداً، أضف تفاصيل الحالة السريرية' })
  @MaxLength(CASE_TEXT_MAX_LENGTH, { message: `الوصف طويل جداً (الحد الأقصى ${CASE_TEXT_MAX_LENGTH} حرف)` })
  caseText: string; // أعراض/فحص/سوابق - يُفضّل بدون اسم صريح للمريض
}

export class PatientChatDto {
  @IsOptional()
  @IsString()
  patientId?: string; // إلزامي فقط عند استدعاء طبيب/سكرتير نيابة عن مريض

  @IsString()
  @MinLength(1)
  @MaxLength(CHAT_MESSAGE_MAX_LENGTH, { message: `الرسالة طويلة جداً (الحد الأقصى ${CHAT_MESSAGE_MAX_LENGTH} حرف)` })
  message: string;
}
