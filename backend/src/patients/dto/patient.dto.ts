import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export class CreatePatientDto {
  @IsString()
  fullName: string;

  @IsDateString()
  birthDate: string;

  @IsIn(['M', 'F'])
  gender: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

export class UpdatePatientDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsIn(['M', 'F'])
  gender?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
