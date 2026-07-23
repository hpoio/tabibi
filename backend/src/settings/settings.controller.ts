import { Controller, Delete, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get('backup')
  @Roles(Role.DOCTOR)
  exportBackup(@CurrentUser() user) {
    return this.settingsService.exportBackup(user);
  }

  @Delete('wipe-data')
  @Roles(Role.DOCTOR)
  wipeAllData(@CurrentUser() user) {
    return this.settingsService.wipeAllPatientData(user);
  }
}
