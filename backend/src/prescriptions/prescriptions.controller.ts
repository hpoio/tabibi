import { Body, Controller, Get, Param, Patch, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto, UpdatePrescriptionDto } from './dto/prescription.dto';

@ApiTags('prescriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private service: PrescriptionsService) {}

  @Post()
  @Roles(Role.DOCTOR)
  create(@CurrentUser() user, @Body() dto: CreatePrescriptionDto) {
    return this.service.create(user.userId, dto);
  }

  @Get('patient/:patientId')
  @Roles(Role.DOCTOR)
  byPatient(@CurrentUser() user, @Param('patientId') patientId: string) {
    return this.service.findByPatient(user.userId, patientId);
  }

  @Patch(':id')
  @Roles(Role.DOCTOR)
  update(@CurrentUser() user, @Param('id') id: string, @Body() dto: UpdatePrescriptionDto) {
    return this.service.update(user.userId, id, dto);
  }

  @Get(':id/pdf')
  @Roles(Role.DOCTOR)
  async pdf(@CurrentUser() user, @Param('id') id: string, @Res() res: Response) {
    const buffer = await this.service.getPdf(user.userId, id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="prescription-${id}.pdf"`,
    });
    res.send(buffer);
  }
}