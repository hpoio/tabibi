import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateMedicalReportDto {
  @IsString()
  patientId: string;

  @IsString()
  templateType: string; // عام | أطفال | قلب | نساء وتوليد ...

  @IsOptional()
  @IsString()
  examination?: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  recommendations?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}
