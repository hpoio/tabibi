import { Module } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { StaffResolverService } from '../common/services/staff-resolver.service';

@Module({
  providers: [PatientsService, StaffResolverService],
  controllers: [PatientsController],
  exports: [PatientsService],
})
export class PatientsModule {}
