import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto, ReplyConsultationDto } from './dto/consultation.dto';

@ApiTags('consultations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('consultations')
export class ConsultationsController {
  constructor(private service: ConsultationsService) {}

  @Post()
  @Roles(Role.DOCTOR)
  create(@CurrentUser() user, @Body() dto: CreateConsultationDto) {
    return this.service.create(user.userId, dto);
  }

  @Get()
  @Roles(Role.DOCTOR)
  findOpen() {
    return this.service.findOpen();
  }

  @Get('mine')
  @Roles(Role.DOCTOR)
  findMine(@CurrentUser() user) {
    return this.service.findMine(user.userId);
  }

  @Post(':id/reply')
  @Roles(Role.DOCTOR)
  reply(@CurrentUser() user, @Param('id') id: string, @Body() dto: ReplyConsultationDto) {
    return this.service.reply(user.userId, id, dto);
  }
}
