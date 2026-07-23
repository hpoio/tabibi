import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as path from 'path';
import { shapeArabicText } from './arabic-text.util';

export interface PrescriptionPdfData {
  clinicName: string;
  doctorName: string;
  doctorSpecialty: string;
  patientName: string;
  patientAge: number;
  date: Date;
  items: { drugName: string; dosage: string; duration: string; notes?: string }[];
}

const FONT_REGULAR = path.join(__dirname, 'fonts', 'Tajawal-Regular.ttf');
const FONT_BOLD = path.join(__dirname, 'fonts', 'Tajawal-Bold.ttf');

@Injectable()
export class PdfService {
  /**
   * توليد وصفة طبية بتصميم احترافي كـ PDF (Buffer)، بخط عربي حقيقي (Tajawal)
   * مع تشكيل صحيح للحروف العربية وترتيب Bidi سليم (راجع arabic-text.util.ts).
   * لا يعتمد على متصفح خارجي (Puppeteer) — يعمل مباشرة بدون تبعيات ثقيلة.
   */
  async generatePrescriptionPdf(data: PrescriptionPdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.registerFont('Tajawal', FONT_REGULAR);
      doc.registerFont('Tajawal-Bold', FONT_BOLD);

      const ar = shapeArabicText;
      const primaryBlue = '#0A5C8C';

      // الترويسة
      doc
        .font('Tajawal-Bold')
        .fillColor(primaryBlue)
        .fontSize(18)
        .text(ar(data.clinicName), { align: 'right' });

      doc
        .font('Tajawal')
        .fillColor('#1E2A33')
        .fontSize(11)
        .text(ar(`${data.doctorName} — ${data.doctorSpecialty}`), { align: 'right' });

      doc.moveDown(0.5);
      doc
        .strokeColor(primaryBlue)
        .lineWidth(1.5)
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke();
      doc.moveDown();

      // بيانات المريض والتاريخ
      doc
        .font('Tajawal')
        .fontSize(11)
        .fillColor('#1E2A33')
        .text(ar(`المريض: ${data.patientName}    العمر: ${data.patientAge} سنة`), {
          align: 'right',
        });
      doc.text(ar(`التاريخ: ${data.date.toLocaleDateString('fr-FR')}`), { align: 'right' });
      doc.moveDown(1.5);

      // الوصفة (Rx)
      doc.font('Tajawal-Bold').fontSize(14).fillColor(primaryBlue).text(ar('الوصفة الطبية'), {
        align: 'right',
      });
      doc.moveDown(0.5);

      data.items.forEach((item, i) => {
        const line = `${i + 1}. ${item.drugName} — ${item.dosage} — لمدة ${item.duration}`;
        doc.font('Tajawal').fontSize(12).fillColor('#1E2A33').text(ar(line), { align: 'right' });
        if (item.notes) {
          doc.fontSize(10).fillColor('#5A6B75').text(ar(`   ${item.notes}`), { align: 'right' });
        }
        doc.moveDown(0.4);
      });

      // منطقة التوقيع
      doc.moveDown(3);
      doc
        .font('Tajawal')
        .fontSize(11)
        .fillColor('#1E2A33')
        .text(ar('توقيع وختم الطبيب'), 350, doc.y, { width: 195, align: 'center' });

      doc.end();
    });
  }
}
