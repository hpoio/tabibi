import { IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateInvoiceDto {
  @IsString()
  patientId: string;

  @IsString()
  service: string; // مثال: "كشف عام"، "كونترول"، "تحاليل"

  @IsNumber()
  @IsPositive()
  amount: number;
}
