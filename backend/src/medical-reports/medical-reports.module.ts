import { Module } from '@nestjs/common';
import { MedicalReportsService } from './medical-reports.service';
import { MedicalReportsController } from './medical-reports.controller';

@Module({
  providers: [MedicalReportsService],
  controllers: [MedicalReportsController],
})
export class MedicalReportsModule {}
