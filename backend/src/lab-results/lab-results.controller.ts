import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LabResultsService } from './lab-results.service';
import { CreateLabResultDto } from './dto/lab-result.dto';

@ApiTags('lab-results')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lab-results')
export class LabResultsController {
  constructor(private service: LabResultsService) {}

  @Post()
  @Roles(Role.DOCTOR, Role.SECRETARY)
  create(@CurrentUser() user, @Body() dto: CreateLabResultDto) {
    return this.service.create(user, dto);
  }

  @Get('patient/:patientId')
  @Roles(Role.DOCTOR, Role.SECRETARY)
  byPatient(
    @CurrentUser() user,
    @Param('patientId') patientId: string,
    @Query('testName') testName?: string,
  ) {
    return this.service.findByPatient(user, patientId, testName);
  }

  @Get('abnormal')
  @Roles(Role.DOCTOR)
  abnormal(@CurrentUser() user) {
    return this.service.findAbnormalForDoctor(user);
  }
}
