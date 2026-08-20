import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { StaffResolverService } from '../common/services/staff-resolver.service';

@Module({
  providers: [AiService, StaffResolverService],
  controllers: [AiController],
})
export class AiModule {}
