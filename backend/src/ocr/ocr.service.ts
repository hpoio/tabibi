import { Injectable, Logger } from '@nestjs/common';
import { createWorker } from 'tesseract.js';

export interface ParsedLabLine {
  rawLine: string;
  testNameGuess?: string;
  valueGuess?: number;
  unitGuess?: string;
}

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  /**
   * يستخرج النص من صورة تحليل طبي (Tesseract.js - يعمل بالكامل على السيرفر
   * بدون أي API خارجي مدفوع).
   *
   * ⚠️ ملاحظة صدق مهمة: لم أتمكن من اختبار هذه الخدمة فعلياً في بيئتي الحالية
   * لأن Tesseract.js يحمّل ملفات بيانات اللغة (traineddata، ~15-40 ميغا لكل
   * لغة) من الإنترنت عند أول استخدام، وشبكتي هنا محجوبة عن مصدرها الافتراضي.
   * الكود يتّبع التوثيق الرسمي للمكتبة وهو نمط قياسي شائع الاستخدام، لكن
   * يجب اختباره فعلياً بصور تحاليل حقيقية عندك قبل الاعتماد عليه في الإنتاج،
   * وضبط دقة regex التحليل (parseLines) حسب الشكل الفعلي لتقارير المخابر
   * التي يتعامل معها أطباؤك (كل مخبر له تنسيق تقرير مختلف قليلاً).
   */
  async extractText(imageBuffer: Buffer): Promise<string> {
    const worker = await createWorker(['ara', 'eng', 'fra']);
    try {
      const {
        data: { text },
      } = await worker.recognize(imageBuffer);
      return text;
    } catch (err) {
      this.logger.error('فشل استخراج النص من الصورة', err as Error);
      throw err;
    } finally {
      await worker.terminate();
    }
  }

  /**
   * تحليل مبدئي (heuristic) لسطور النص المستخرج لاقتراح: اسم التحليل + القيمة + الوحدة.
   * هذه اقتراحات فقط تُعرض للطبيب/السكرتير للتأكيد والتعديل قبل الحفظ -
   * لا يتم حفظ أي شيء تلقائياً بدون مراجعة بشرية (مهم لسلامة البيانات الطبية).
   */
  parseLines(rawText: string): ParsedLabLine[] {
    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    // نمط شائع: "اسم التحليل .... 12.5 mg/dL" أو "Glucose: 5.4 g/L"
    const pattern = /([\p{L}\s]+?)[\s:.,]*([\d]+[.,]?[\d]*)\s*([a-zA-Z%\/µ]+)?/u;

    return lines.map((rawLine) => {
      const match = rawLine.match(pattern);
      if (!match) return { rawLine };

      const [, namePart, valuePart, unitPart] = match;
      const value = parseFloat(valuePart.replace(',', '.'));

      return {
        rawLine,
        testNameGuess: namePart?.trim() || undefined,
        valueGuess: isNaN(value) ? undefined : value,
        unitGuess: unitPart?.trim() || undefined,
      };
    });
  }
}
