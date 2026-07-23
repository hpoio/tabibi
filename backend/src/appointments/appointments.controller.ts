import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto/appointment.dto';

@ApiTags('appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(Role.DOCTOR, Role.SECRETARY)
  create(@CurrentUser() user, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(user, dto);
  }

  @Get('today')
  @Roles(Role.DOCTOR, Role.SECRETARY, Role.ASSISTANT)
  today(@CurrentUser() user) {
    return this.appointmentsService.findToday(user);
  }

  @Get()
  @Roles(Role.DOCTOR, Role.SECRETARY, Role.ASSISTANT)
  range(@CurrentUser() user, @Query('from') from: string, @Query('to') to: string) {
    return this.appointmentsService.findByRange(user, from, to);
  }

  @Patch(':id')
  @Roles(Role.DOCTOR, Role.SECRETARY)
  update(@CurrentUser() user, @Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.appointmentsService.update(user, id, dto);
  }
}
