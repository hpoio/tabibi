import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MeService } from './me.service';

/** كل نقاط هذا الكنترولر خاصة بالمريض المسجّل دخوله فقط (تطبيق الموبايل) */
@ApiTags('me')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PATIENT)
@Controller('me')
export class MeController {
  constructor(private service: MeService) {}

  @Get('profile')
  profile(@CurrentUser() user) {
    return this.service.getProfile(user.userId);
  }

  @Get('appointments')
  appointments(@CurrentUser() user) {
    return this.service.getUpcomingAppointments(user.userId);
  }

  @Get('prescriptions')
  prescriptions(@CurrentUser() user) {
    return this.service.getPrescriptions(user.userId);
  }

  @Get('lab-results')
  labResults(@CurrentUser() user) {
    return this.service.getLabResults(user.userId);
  }

  @Get('invoices')
  invoices(@CurrentUser() user) {
    return this.service.getInvoices(user.userId);
  }

  @Get('chat-history')
  chatHistory(@CurrentUser() user) {
    return this.service.getChatHistory(user.userId);
  }
}
