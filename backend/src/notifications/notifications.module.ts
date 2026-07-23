import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsCronService } from './notifications-cron.service';
import { StaffResolverService } from '../common/services/staff-resolver.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsCronService, StaffResolverService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
