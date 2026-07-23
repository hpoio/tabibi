import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PatientsService } from './patients.service';
import { CreatePatientDto, UpdatePatientDto } from './dto/patient.dto';

@ApiTags('patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients')
export class PatientsController {
  constructor(private patientsService: PatientsService) {}

  @Post()
  @Roles(Role.DOCTOR)
  create(@CurrentUser() user, @Body() dto: CreatePatientDto) {
    return this.patientsService.create(user, dto);
  }

  @Get()
  @Roles(Role.DOCTOR, Role.SECRETARY, Role.ASSISTANT)
  findAll(@CurrentUser() user, @Query('search') search?: string) {
    return this.patientsService.findAll(user, search);
  }

  @Get(':id')
  @Roles(Role.DOCTOR, Role.SECRETARY, Role.ASSISTANT)
  findOne(@CurrentUser() user, @Param('id') id: string) {
    return this.patientsService.findOne(user, id);
  }

  @Patch(':id')
  @Roles(Role.DOCTOR, Role.SECRETARY)
  update(@CurrentUser() user, @Param('id') id: string, @Body() dto: UpdatePatientDto) {
    return this.patientsService.update(user, id, dto);
  }

  @Get(':id/qr')
  @Roles(Role.DOCTOR, Role.SECRETARY)
  getQr(@CurrentUser() user, @Param('id') id: string) {
    return this.patientsService.generateQrImage(user, id);
  }
}
