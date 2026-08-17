import { Module } from '@nestjs/common';
import { MedicalReportsService } from './medical-reports.service';
import { MedicalReportsController } from './medical-reports.controller';
import { StaffResolverService } from '../common/services/staff-resolver.service';

@Module({
  providers: [MedicalReportsService, StaffResolverService],
  controllers: [MedicalReportsController],
})
export class MedicalReportsModule {}
