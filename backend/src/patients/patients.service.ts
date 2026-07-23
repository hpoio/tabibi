import { Injectable, NotFoundException } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { StaffResolverService, CurrentUserPayload } from '../common/services/staff-resolver.service';
import { CreatePatientDto, UpdatePatientDto } from './dto/patient.dto';

@Injectable()
export class PatientsService {
  constructor(
    private prisma: PrismaService,
    private staffResolver: StaffResolverService,
  ) {}

  async create(user: CurrentUserPayload, dto: CreatePatientDto) {
    const doctorId = await this.staffResolver.resolveDoctorId(user);

    const patient = await this.prisma.patientProfile.create({
      data: {
        fullName: dto.fullName,
        birthDate: new Date(dto.birthDate),
        gender: dto.gender,
        phone: dto.phone,
        address: dto.address,
        primaryDoctorId: doctorId,
      },
    });

    return patient;
  }

  async findAll(user: CurrentUserPayload, search?: string) {
    const doctorId = await this.staffResolver.resolveDoctorId(user);

    return this.prisma.patientProfile.findMany({
      where: {
        primaryDoctorId: doctorId,
        ...(search
          ? { fullName: { contains: search, mode: 'insensitive' } }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(user: CurrentUserPayload, patientId: string) {
    const doctorId = await this.staffResolver.resolveDoctorId(user);
    const patient = await this.prisma.patientProfile.findFirst({
      where: { id: patientId, primaryDoctorId: doctorId },
      include: {
        appointments: { orderBy: { scheduledAt: 'desc' }, take: 10 },
        medicalRecords: { orderBy: { createdAt: 'desc' }, take: 10 },
        prescriptions: { include: { items: true }, orderBy: { createdAt: 'desc' }, take: 10 },
        labResults: { orderBy: { takenAt: 'desc' }, take: 20 },
        invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!patient) throw new NotFoundException('المريض غير موجود');
    return patient;
  }

  async update(user: CurrentUserPayload, patientId: string, dto: UpdatePatientDto) {
    await this.findOne(user, patientId);

    const data: Record<string, any> = { ...dto };
    if (data.birthDate) {
      data.birthDate = new Date(data.birthDate);
    }

    return this.prisma.patientProfile.update({
      where: { id: patientId },
      data,
    });
  }

  async generateQrImage(user: CurrentUserPayload, patientId: string) {
    const patient = await this.findOne(user, patientId);
    const qrDataUrl = await QRCode.toDataURL(patient.qrCodeId, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 300,
    });
    return { qrCodeId: patient.qrCodeId, qrImage: qrDataUrl };
  }

  async scanQr(qrCodeId: string) {
    const patient = await this.prisma.patientProfile.findUnique({
      where: { qrCodeId },
      include: {
        prescriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { items: true },
        },
        appointments: {
          where: { scheduledAt: { gte: new Date() } },
          orderBy: { scheduledAt: 'asc' },
          take: 1,
        },
      },
    });
    if (!patient) throw new NotFoundException('رمز QR غير صالح');

    return {
      patientFirstName: patient.fullName.split(' ')[0],
      todayMedications: patient.prescriptions[0]?.items ?? [],
      nextAppointment: patient.appointments[0] ?? null,
    };
  }
}
