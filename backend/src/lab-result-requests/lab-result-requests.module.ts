import { Module } from '@nestjs/common';
import { LabResultRequestsService } from './lab-result-requests.service';
import { LabResultRequestsController } from './lab-result-requests.controller';
import { StaffResolverService } from '../common/services/staff-resolver.service';

@Module({
  providers: [LabResultRequestsService, StaffResolverService],
  controllers: [LabResultRequestsController],
  exports: [LabResultRequestsService],
})
export class LabResultRequestsModule {}
