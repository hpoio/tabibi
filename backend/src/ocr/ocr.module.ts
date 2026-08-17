import { Module } from '@nestjs/common';
import { OcrService } from './ocr.service';
import { OcrController } from './ocr.controller';
import { LabResultRequestsModule } from '../lab-result-requests/lab-result-requests.module';

@Module({
  imports: [LabResultRequestsModule],
  providers: [OcrService],
  controllers: [OcrController],
})
export class OcrModule {}
