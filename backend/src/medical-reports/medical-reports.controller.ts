import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MedicalReportsService } from './medical-reports.service';
import { CreateMedicalReportDto } from './dto/medical-report.dto';

@ApiTags('medical-reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('medical-reports')
export class MedicalReportsController {
  constructor(private service: MedicalReportsService) {}

  @Post()
  @Roles(Role.DOCTOR)
  create(@CurrentUser() user, @Body() dto: CreateMedicalReportDto) {
    return this.service.create(user, dto);
  }

  @Get('patient/:patientId')
  @Roles(Role.DOCTOR)
  byPatient(@CurrentUser() user, @Param('patientId') patientId: string) {
    return this.service.findByPatient(user, patientId);
  }
}
