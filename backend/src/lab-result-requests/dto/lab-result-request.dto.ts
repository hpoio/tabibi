import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

/**
 * سطر واحد وافق عليه الطبيب فعلياً - القيم هنا ليست بالضرورة نفس اقتراح
 * الـ OCR الخام (suggestions)، لأن الطبيب قد يصحّح اسم التحليل أو القيمة
 * يدوياً قبل الموافقة. لا شيء يُحفظ في LabResult بدون مرور من هنا.
 */
export class ApprovedLabLineDto {
  @IsString()
  testName: string;

  @IsNumber()
  value: number;

  @IsString()
  unit: string;

  @IsOptional()
  @IsNumber()
  normalMin?: number;

  @IsOptional()
  @IsNumber()
  normalMax?: number;
}

export class ApproveLabResultRequestDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'يجب اختيار سطر واحد على الأقل للموافقة عليه' })
  @ValidateNested({ each: true })
  @Type(() => ApprovedLabLineDto)
  items: ApprovedLabLineDto[];
}

export class RejectLabResultRequestDto {
  @IsOptional()
  @IsString()
  note?: string;
}
