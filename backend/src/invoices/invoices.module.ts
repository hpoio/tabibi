import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { StaffResolverService } from '../common/services/staff-resolver.service';

@Module({
  providers: [InvoicesService, StaffResolverService],
  controllers: [InvoicesController],
})
export class InvoicesModule {}
