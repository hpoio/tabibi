import { Module } from '@nestjs/common';
import { PatientsModule } from '../patients/patients.module';
import { QrController } from './qr.controller';

@Module({
  imports: [PatientsModule],
  controllers: [QrController],
})
export class QrModule {}
