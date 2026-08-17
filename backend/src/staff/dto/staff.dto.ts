import { IsEnum, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateStaffDto {
  @IsString()
  fullName: string;

  @IsString()
  phone: string;

  @IsString()
  @MinLength(8, { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' })
  @MaxLength(72, { message: 'كلمة المرور طويلة جداً' })
  @Matches(/(?=.*[A-Za-z\u0600-\u06FF])(?=.*\d)/, {
    message: 'كلمة المرور يجب أن تحتوي على حروف وأرقام معاً',
  })
  password: string;

  @IsEnum(Role, { message: 'الدور يجب أن يكون SECRETARY أو ASSISTANT فقط' })
  role: Role;
}
