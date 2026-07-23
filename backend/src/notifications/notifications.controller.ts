import { Controller, Get, Patch, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { StaffResolverService } from '../common/services/staff-resolver.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private notificationsService: NotificationsService,
    private staffResolver: StaffResolverService,
  ) {}

  @Get()
  async findMany(@Req() req, @Query('unreadOnly') unreadOnly?: string, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    const doctorId = await this.staffResolver.resolveDoctorId(req.user);
    return this.notificationsService.findMany(doctorId, {
      unreadOnly: unreadOnly === 'true',
      page: page ? +page : undefined,
      pageSize: pageSize ? +pageSize : undefined,
    });
  }

  @Patch(':id/read')
  async markRead(@Req() req, @Param('id') id: string) {
    const doctorId = await this.staffResolver.resolveDoctorId(req.user);
    return this.notificationsService.markRead(id, doctorId);
  }

  @Patch('read-all')
  async markAllRead(@Req() req) {
    const doctorId = await this.staffResolver.resolveDoctorId(req.user);
    return this.notificationsService.markAllRead(doctorId);
  }
}
