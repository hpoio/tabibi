import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role, InvoiceStatus } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/invoice.dto';

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private service: InvoicesService) {}

  @Post()
  @Roles(Role.DOCTOR, Role.SECRETARY)
  create(@CurrentUser() user, @Body() dto: CreateInvoiceDto) {
    return this.service.create(user, dto);
  }

  @Get()
  @Roles(Role.DOCTOR, Role.SECRETARY)
  findAll(@CurrentUser() user, @Query('status') status?: InvoiceStatus) {
    return this.service.findAllForDoctor(user, status);
  }

  @Get('patient/:patientId')
  @Roles(Role.DOCTOR, Role.SECRETARY)
  byPatient(@CurrentUser() user, @Param('patientId') patientId: string) {
    return this.service.findByPatient(user, patientId);
  }

  @Patch(':id/mark-paid')
  @Roles(Role.DOCTOR, Role.SECRETARY)
  markPaid(@CurrentUser() user, @Param('id') id: string) {
    return this.service.markPaid(user, id);
  }
}
