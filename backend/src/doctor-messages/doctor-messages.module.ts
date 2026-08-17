import { Module } from '@nestjs/common';
import { DoctorMessagesService } from './doctor-messages.service';
import { DoctorMessagesController } from './doctor-messages.controller';

@Module({
  providers: [DoctorMessagesService],
  controllers: [DoctorMessagesController],
})
export class DoctorMessagesModule {}
