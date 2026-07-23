import { Injectable, NotFoundException } from '@nestjs/common';
import { InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StaffResolverService, CurrentUserPayload } from '../common/services/staff-resolver.service';
import { CreateInvoiceDto } from './dto/invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private staffResolver: StaffResolverService,
  ) {}

  async create(user: CurrentUserPayload, dto: CreateInvoiceDto) {
    await this.staffResolver.resolveDoctorId(user);

    const patient = await this.prisma.patientProfile.findUnique({ where: { id: dto.patientId } });
    if (!patient) throw new NotFoundException('المريض غير موجود');

    return this.prisma.invoice.create({
      data: { patientId: dto.patientId, service: dto.service, amount: dto.amount },
    });
  }

  async findByPatient(user: CurrentUserPayload, patientId: string) {
    await this.staffResolver.resolveDoctorId(user);
    return this.prisma.invoice.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllForDoctor(user: CurrentUserPayload, status?: InvoiceStatus) {
    const doctorId = await this.staffResolver.resolveDoctorId(user);
    return this.prisma.invoice.findMany({
      where: {
        patient: { primaryDoctorId: doctorId },
        ...(status ? { status } : {}),
      },
      include: { patient: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markPaid(user: CurrentUserPayload, invoiceId: string) {
    const doctorId = await this.staffResolver.resolveDoctorId(user);
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, patient: { primaryDoctorId: doctorId } },
    });
    if (!invoice) throw new NotFoundException('الفاتورة غير موجودة');

    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: InvoiceStatus.PAID, paidAt: new Date() },
    });
  }
}
