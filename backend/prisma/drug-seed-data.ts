/**
 * ⚠️ ملاحظة مهمة: هذه قائمة أدوية شائعة (نموذج أولي فقط) لتفعيل خاصية
 * الاقتراح التلقائي أثناء الكتابة. في الإنتاج، يجب استيراد قاعدة بيانات
 * الأدوية الجزائرية الرسمية (نظير الفهرس الوطني للمنتجات الصيدلانية)
 * عبر ملف/API رسمي معتمد، وليس هذه القائمة اليدوية.
 */
export const DRUG_SEED_DATA = [
  { tradeName: 'Doliprane', scientificName: 'Paracétamol', form: 'أقراص', strength: '500mg' },
  { tradeName: 'Efferalgan', scientificName: 'Paracétamol', form: 'أقراص فوارة', strength: '1g' },
  { tradeName: 'Amoxil', scientificName: 'Amoxicilline', form: 'كبسولات', strength: '500mg' },
  { tradeName: 'Augmentin', scientificName: 'Amoxicilline/Acide Clavulanique', form: 'أقراص', strength: '1g' },
  { tradeName: 'Aspégic', scientificName: 'Acide acétylsalicylique', form: 'مسحوق', strength: '1g' },
  { tradeName: 'Ventoline', scientificName: 'Salbutamol', form: 'بخاخ استنشاق', strength: '100µg' },
  { tradeName: 'Glucophage', scientificName: 'Metformine', form: 'أقراص', strength: '850mg' },
  { tradeName: 'Lasilix', scientificName: 'Furosémide', form: 'أقراص', strength: '40mg' },
  { tradeName: 'Tahor', scientificName: 'Atorvastatine', form: 'أقراص', strength: '20mg' },
  { tradeName: 'Loxen', scientificName: 'Nicardipine', form: 'أقراص', strength: '20mg' },
  { tradeName: 'Motilium', scientificName: 'Dompéridone', form: 'أقراص', strength: '10mg' },
  { tradeName: 'Smecta', scientificName: 'Diosmectite', form: 'مسحوق معلق', strength: '3g' },
];
