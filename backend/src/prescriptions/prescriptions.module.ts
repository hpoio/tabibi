import { Module } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { PrescriptionsController } from './prescriptions.controller';
import { StaffResolverService } from '../common/services/staff-resolver.service';

@Module({
  providers: [PrescriptionsService, StaffResolverService],
  controllers: [PrescriptionsController],
})
export class PrescriptionsModule {}
