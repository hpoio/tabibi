import { Module } from '@nestjs/common';
import { LabResultsService } from './lab-results.service';
import { LabResultsController } from './lab-results.controller';
import { StaffResolverService } from '../common/services/staff-resolver.service';

@Module({
  providers: [LabResultsService, StaffResolverService],
  controllers: [LabResultsController],
})
export class LabResultsModule {}
