import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateLabResultDto {
  @IsString()
  patientId: string;

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

  @IsOptional()
  @IsDateString()
  takenAt?: string;
}
