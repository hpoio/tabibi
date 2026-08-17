import { Body, Controller, Post, HttpCode } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  // حماية ضد إنشاء حسابات آلياً بكميات كبيرة (bot/spam): 10 محاولات كحد أقصى كل دقيقة لكل IP
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  // حماية صارمة ضد تخمين كلمة المرور: 5 محاولات كحد أقصى كل دقيقة لكل IP
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(200)
  // نفس حد الحماية من التخمين، لأن refresh token هو أيضاً بيانات حساسة
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }
}
