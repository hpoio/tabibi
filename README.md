# المساعد الطبي الذكي — المشروع الكامل

هذا الملف يحتوي المشروع بالكامل: **الباك-إند** + **واجهة ويب الطبيب** + **تطبيق موبايل المريض (Flutter)**.

## 📁 الهيكل

```
medical-assistant/
├── backend/     → NestJS + Prisma + PostgreSQL (كل الـ API والمنطق)
├── web/         → Next.js (لوحة تحكم الطبيب) — مربوطة فعلياً بالباك-إند
└── mobile/      → Flutter (تطبيق المريض) — غير مُختبَر (راجع mobile/README.md)
```

كل مجلد يحتوي `README.md` خاصاً به بتعليمات مفصّلة.

## 🚀 التشغيل الكامل (بالترتيب)

```bash
# 1) الباك-إند
cd backend
npm install
cp .env.example .env        # عدّل DATABASE_URL
npx prisma generate
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts  # بيانات تجريبية
npm run start:dev           # http://localhost:3000 | Swagger: /docs

# 2) الويب (طرفية أخرى)
cd web
cp .env.example .env.local
npm install
npm run dev

# 3) الموبايل (طرفية أخرى، يحتاج Flutter SDK مثبَّتاً عندك)
cd mobile
flutter pub get
flutter run
```

بيانات دخول تجريبية (طبيب، بعد seed.ts): `0555000111` / `password123`

## ✅ الحالة العامة

| الجزء | الحالة |
|---|---|
| الباك-إند (13 وحدة، المراحل 1-5) | ✅ ~85% |
| الويب (لوحة تحكم الطبيب) | ✅ ~70% — مربوط فعلياً بالـ API الحقيقي |
| الموبايل (تطبيق المريض) | 🟡 ~30% — أول نسخة، **غير مُختبَرة إطلاقاً** |
| تطبيق الطبيب على الموبايل | ❌ 0% — لم يُبدأ |

## ⚠️ الأولويات المتبقية بصراحة

1. **تشغيل تطبيق الموبايل واختباره لأول مرة** (`flutter analyze` ثم `flutter run`) — لم أستطع فعل هذا بنفسي، بيئتي لا تملك Flutter
2. مسح QR بالكاميرا في الموبايل (غير مبني بعد)
3. تطبيق الطبيب على الموبايل (لم يُبدأ - الطبيب يستخدم الويب حالياً فقط)
4. إشعارات Push حقيقية + SMS Gateway جزائري حقيقي
5. اختبار OCR والذكاء الاصطناعي بحالات حقيقية (يحتاج ANTHROPIC_API_KEY منك)
6. مراجعة طبية لقائمة الكلمات الطارئة في `backend/src/ai/emergency-keywords.ts`
7. التجهيز للإنتاج (استضافة، HTTPS، rate-limiting) والنشر على المتاجر

## 🔑 مفاتيح/حسابات ستحتاجها منك في مرحلة ما
- مفتاح `ANTHROPIC_API_KEY` (للمساعد التشخيصي وشات المريض)
- حساب PostgreSQL حقيقي (أو استضافة مُدارة مثل Supabase/Neon)
- لاحقاً: حساب مطوّر Google Play + Apple Developer، ومزوّد SMS جزائري
