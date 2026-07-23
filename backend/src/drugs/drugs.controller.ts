import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DrugsService } from './drugs.service';

@ApiTags('drugs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('drugs')
export class DrugsController {
  constructor(private drugsService: DrugsService) {}

  @Get('search')
  search(@Query('q') q: string) {
    return this.drugsService.search(q);
  }
}
