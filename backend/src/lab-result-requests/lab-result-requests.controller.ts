import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LabResultRequestStatus, Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LabResultRequestsService } from './lab-result-requests.service';
import { ApproveLabResultRequestDto, RejectLabResultRequestDto } from './dto/lab-result-request.dto';

@ApiTags('lab-result-requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lab-result-requests')
export class LabResultRequestsController {
  constructor(private service: LabResultRequestsService) {}

  /** المريض يعرض قائمة طلباته هو فقط (كل الحالات) - لشاشة "طلباتي" في التطبيق. */
  @Get('mine')
  @Roles(Role.PATIENT)
  findMine(@CurrentUser() user) {
    return this.service.findMine(user);
  }

  /** الطبيب/السكرتير يعرض الطلبات المعلّقة (أو حسب status) لدى مرضاه فقط. */
  @Get()
  @Roles(Role.DOCTOR, Role.SECRETARY)
  findForDoctor(@CurrentUser() user, @Query('status') status?: LabResultRequestStatus) {
    return this.service.findForDoctor(user, status);
  }

  @Post(':id/approve')
  @Roles(Role.DOCTOR, Role.SECRETARY)
  approve(@CurrentUser() user, @Param('id') id: string, @Body() dto: ApproveLabResultRequestDto) {
    return this.service.approve(user, id, dto);
  }

  @Post(':id/reject')
  @Roles(Role.DOCTOR, Role.SECRETARY)
  reject(@CurrentUser() user, @Param('id') id: string, @Body() dto: RejectLabResultRequestDto) {
    return this.service.reject(user, id, dto);
  }
}
