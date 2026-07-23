import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { OcrService } from './ocr.service';

@ApiTags('ocr')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ocr')
export class OcrController {
  constructor(private ocrService: OcrService) {}

  /**
   * استقبال صورة تحليل ومسحها ضوئياً، ثم إرجاع اقتراحات (غير محفوظة بعد)
   * لتُعرض في الواجهة للتأكيد اليدوي قبل إنشاء LabResult فعلي عبر
   * POST /lab-results.
   */
  @Post('lab-result')
  @ApiConsumes('multipart/form-data')
  @Roles(Role.DOCTOR, Role.SECRETARY)
  @UseInterceptors(FileInterceptor('file'))
  async scanLabResult(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('لم يتم إرفاق أي صورة');

    const text = await this.ocrService.extractText(file.buffer);
    const suggestions = this.ocrService.parseLines(text);

    return { rawText: text, suggestions };
  }
}
