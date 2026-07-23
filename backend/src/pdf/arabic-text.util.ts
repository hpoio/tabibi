import * as ArabicReshaper from 'arabic-reshaper';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bidiFactory = require('bidi-js');

const bidi = bidiFactory();

/**
 * يُحضّر نصاً عربياً (أو مختلطاً عربي/لاتيني/أرقام) لعرض صحيح في PDFKit.
 *
 * PDFKit لا يقوم تلقائياً بـ:
 *  1) تشكيل الحروف العربية (Contextual shaping): ربط الحروف ببعضها حسب موقعها
 *     في الكلمة (بداية/وسط/نهاية/منفصل) — بدونها تظهر الحروف منفصلة.
 *  2) ترتيب Bidi: النص العربي منطقياً يُكتب من اليسار لليمين في الذاكرة
 *     (الحرف الأول المكتوب هو أول حرف بالكلمة) لكن يُعرض من اليمين لليسار.
 *
 * الحل: (أ) تحويل الأحرف لأشكال العرض السياقية عبر arabic-reshaper،
 *       (ب) إعادة ترتيب الأحرف بصرياً عبر خوارزمية Unicode Bidirectional
 *           Algorithm (bidi-js) بحيث يعرضها PDFKit بالترتيب الصحيح
 *           عند الرسم من اليسار لليمين (سلوكه الافتراضي).
 */
export function shapeArabicText(text: string): string {
  if (!text) return text;

  const reshaped: string = (ArabicReshaper as any).convertArabic(text);

  const embeddingLevels = bidi.getEmbeddingLevels(reshaped);
  const flips = bidi.getReorderSegments(reshaped, embeddingLevels);

  const chars = Array.from(reshaped);
  for (const [start, end] of flips) {
    let i = start;
    let j = end;
    while (i < j) {
      const tmp = chars[i];
      chars[i] = chars[j];
      chars[j] = tmp;
      i++;
      j--;
    }
  }

  return chars.join('');
}
