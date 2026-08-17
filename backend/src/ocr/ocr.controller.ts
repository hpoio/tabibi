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
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OcrService } from './ocr.service';
import { LabResultRequestsService } from '../lab-result-requests/lab-result-requests.service';

// حد أقصى 8 ميغا للصورة الواحدة - كافٍ لصورة تحليل بجودة مقروءة عبر
// كاميرا هاتف، ويمنع إرهاق worker الـ OCR (Tesseract.js) بصور ضخمة غير ضرورية.
const MAX_OCR_IMAGE_BYTES = 8 * 1024 * 1024;

@ApiTags('ocr')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ocr')
export class OcrController {
  constructor(
    private ocrService: OcrService,
    private labResultRequestsService: LabResultRequestsService,
  ) {}

  /**
   * استقبال صورة تحليل ومسحها ضوئياً، ثم إرجاع اقتراحات (غير محفوظة بعد)
   * لتُعرض في الواجهة للتأكيد اليدوي قبل إنشاء LabResult فعلي عبر
   * POST /lab-results. للطبيب/السكرتير فقط - يُنشئان السجل مباشرة لأنهما
   * الجهة المسؤولة قانونياً عن دقة البيانات الطبية المحفوظة.
   */
  @Post('lab-result')
  @ApiConsumes('multipart/form-data')
  @Roles(Role.DOCTOR, Role.SECRETARY)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_OCR_IMAGE_BYTES } }))
  async scanLabResult(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('لم يتم إرفاق أي صورة');

    const text = await this.ocrService.extractText(file.buffer);
    const suggestions = this.ocrService.parseLines(text);

    return { rawText: text, suggestions };
  }

  /**
   * نفس المسح الضوئي، لكن للمريض من التطبيق. المريض لا يملك صلاحية إنشاء
   * LabResult مباشرة أبداً (بيانات طبية حساسة) - بدل ذلك يُنشأ هنا طلب
   * معلّق (LabResultRequest) بانتظار موافقة الطبيب المعالج عبر
   * POST /lab-result-requests/:id/approve. راجع وحدة lab-result-requests.
   */
  @Post('lab-result-request')
  @ApiConsumes('multipart/form-data')
  @Roles(Role.PATIENT)
  // حماية تكلفة: OCR عملية ثقيلة (Tesseract) - نمنع إغراق الخادم بمحاولات متكررة.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_OCR_IMAGE_BYTES } }))
  async scanLabResultAsPatient(@CurrentUser() user, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('لم يتم إرفاق أي صورة');

    const text = await this.ocrService.extractText(file.buffer);
    const suggestions = this.ocrService.parseLines(text);

    return this.labResultRequestsService.createFromOcr(user, text, suggestions);
  }
}
