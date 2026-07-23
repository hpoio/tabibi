import { Module } from '@nestjs/common';
import { LabResultsService } from './lab-results.service';
import { LabResultsController } from './lab-results.controller';

@Module({
  providers: [LabResultsService],
  controllers: [LabResultsController],
})
export class LabResultsModule {}
