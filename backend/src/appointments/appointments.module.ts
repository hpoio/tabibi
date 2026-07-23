import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { StaffResolverService } from '../common/services/staff-resolver.service';
import { NotificationsService } from '../notifications/notifications.service';

@Module({
  providers: [AppointmentsService, StaffResolverService, NotificationsService],
  controllers: [AppointmentsController],
})
export class AppointmentsModule {}
