import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { StaffResolverService } from '../common/services/staff-resolver.service';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService, StaffResolverService],
})
export class SettingsModule {}
