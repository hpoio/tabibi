import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/staff.dto';

@ApiTags('staff')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('staff')
export class StaffController {
  constructor(private staffService: StaffService) {}

  @Post()
  @Roles(Role.DOCTOR)
  create(@CurrentUser() user, @Body() dto: CreateStaffDto) {
    return this.staffService.create(user.userId, dto);
  }

  @Get()
  @Roles(Role.DOCTOR)
  findAll(@CurrentUser() user) {
    return this.staffService.findAll(user.userId);
  }
}
