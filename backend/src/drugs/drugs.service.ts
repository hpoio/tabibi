import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DrugsService {
  constructor(private prisma: PrismaService) {}

  /** اقتراح تلقائي أثناء كتابة اسم الدواء في الوصفة */
  async search(query: string) {
    if (!query || query.length < 2) return [];
    return this.prisma.drug.findMany({
      where: { tradeName: { contains: query, mode: 'insensitive' } },
      take: 8,
      orderBy: { tradeName: 'asc' },
    });
  }
}
