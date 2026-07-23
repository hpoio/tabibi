import { IsOptional, IsString, MinLength } from 'class-validator';

export class DiagnosisAssistDto {
  @IsString()
  @MinLength(10)
  caseText: string; // أعراض/فحص/سوابق - يُفضّل بدون اسم صريح للمريض
}

export class PatientChatDto {
  @IsOptional()
  @IsString()
  patientId?: string; // إلزامي فقط عند استدعاء طبيب/سكرتير نيابة عن مريض

  @IsString()
  @MinLength(1)
  message: string;
}
