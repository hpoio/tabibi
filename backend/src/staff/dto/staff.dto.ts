import { IsEnum, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateStaffDto {
  @IsString()
  fullName: string;

  @IsString()
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(Role, { message: 'الدور يجب أن يكون SECRETARY أو ASSISTANT فقط' })
  role: Role;
}
