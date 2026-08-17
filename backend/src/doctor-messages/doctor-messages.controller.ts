import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DoctorMessagesService } from './doctor-messages.service';
import { SendMessageDto } from './dto/doctor-messages.dto';

@ApiTags('doctor-messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('doctor-messages')
export class DoctorMessagesController {
  constructor(private service: DoctorMessagesService) {}

  @Get('doctors')
  @Roles(Role.DOCTOR)
  listDoctors(@CurrentUser() user) {
    return this.service.listDoctors(user.userId);
  }

  @Post()
  @Roles(Role.DOCTOR)
  send(@CurrentUser() user, @Body() dto: SendMessageDto) {
    return this.service.send(user.userId, dto);
  }

  @Get('conversations')
  @Roles(Role.DOCTOR)
  listConversations(@CurrentUser() user) {
    return this.service.listConversations(user.userId);
  }

  @Get('unread-count')
  @Roles(Role.DOCTOR)
  unreadCount(@CurrentUser() user) {
    return this.service.unreadCount(user.userId);
  }

  @Get('with/:doctorId')
  @Roles(Role.DOCTOR)
  getConversation(@CurrentUser() user, @Param('doctorId') doctorId: string) {
    return this.service.getConversation(user.userId, doctorId);
  }

  @Patch('with/:doctorId/read')
  @Roles(Role.DOCTOR)
  markAsRead(@CurrentUser() user, @Param('doctorId') doctorId: string) {
    return this.service.markAsRead(user.userId, doctorId);
  }
}
