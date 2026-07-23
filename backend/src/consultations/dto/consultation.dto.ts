import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateConsultationDto {
  @IsString()
  @MinLength(10)
  caseText: string;

  @IsOptional()
  @IsBoolean()
  caseAnonymized?: boolean; // افتراضياً true - يُفترض عدم ذكر اسم المريض
}

export class ReplyConsultationDto {
  @IsString()
  @MinLength(2)
  replyText: string;
}
