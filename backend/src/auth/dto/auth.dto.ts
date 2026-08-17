import { IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @IsString()
  fullName: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(8, { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' })
  @MaxLength(72, { message: 'كلمة المرور طويلة جداً' }) // bcrypt يتجاهل ما بعد 72 بايت
  @Matches(/(?=.*[A-Za-z\u0600-\u06FF])(?=.*\d)/, {
    message: 'كلمة المرور يجب أن تحتوي على حروف وأرقام معاً',
  })
  password: string;

  @IsEnum(Role)
  role: Role;
}

export class LoginDto {
  @IsString()
  phone: string;

  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}
