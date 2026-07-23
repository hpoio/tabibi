# Medical Assistant Web — لوحة تحكم الطبيب

واجهة ويب (Next.js 15 + Tailwind CSS 4) **مربوطة فعلياً بالباك-إند الحقيقي** (وليست بيانات وهمية).

## 🚀 التشغيل المحلي

```bash
cp .env.example .env.local   # عدّل NEXT_PUBLIC_API_URL إن لزم
npm install
npm run dev
```

⚠️ **يجب تشغيل الباك-إند أولاً** (`../backend`) قبل فتح هذه الواجهة، وإلا ستفشل كل الطلبات.

افتح `http://localhost:3000` (أو 3001 إن كان الباك-إند يشغل 3000) — سيوجهك تلقائياً لصفحة تسجيل الدخول.

بيانات دخول تجريبية (بعد تشغيل `backend/prisma/seed.ts`): `0555000111` / `password123`

## 📁 الصفحات (كلها مربوطة بـ API حقيقي)

| الصفحة | تربطها بـ |
|---|---|
| `/login` | `POST /auth/login` |
| `/dashboard` | `GET /appointments/today`, `GET /lab-results/abnormal` |
| `/dashboard/patients` | `GET/POST /patients`, `GET /patients/:id/qr` |
| `/dashboard/prescriptions` | `GET /drugs/search`, `POST /prescriptions`, `GET /prescriptions/:id/pdf` |
| `/dashboard/labs` | `POST /ocr/lab-result`, `GET/POST /lab-results` |
| `/dashboard/ai-assist` | `POST /ai/diagnosis-assist` (يحتاج ANTHROPIC_API_KEY في الباك-إند) |
| `/dashboard/appointments` | `GET /appointments`, `POST /appointments` |
| `/dashboard/reports` | `GET/POST /medical-reports` |
| `/dashboard/invoices` | `GET /invoices`, `PATCH /invoices/:id/mark-paid` |
| `/dashboard/network` | `GET/POST /consultations` |
| `/dashboard/analytics` | `GET /analytics/dashboard` |

## 🔐 المصادقة
الجلسة تُحفظ في `localStorage` (`lib/auth.ts`). أي صفحة تحت `/dashboard` محمية عبر `components/AuthGuard.tsx` — يُعاد توجيه غير المسجَّل دخوله لـ `/login` تلقائياً. عند أي رد `401` من الباك-إند، يُسجَّل الخروج تلقائياً.

## 🎨 نظام التصميم
الألوان والخطوط في `app/globals.css` (`--primary`, `--accent`, `--danger`, `--success`، خط Tajawal، RTL).

## ⚠️ ما لم يُبنَ بعد في هذه الواجهة
- صفحة تفاصيل مريض منفردة (`/dashboard/patients/[id]`) بسجل كامل موحّد (مواعيد+تقارير+وصفات+تحاليل في مكان واحد)
- واجهة شات المريض الفعلية (الـ API جاهز في `/ai/chat`، لكنها موجّهة للمريض وليس للطبيب، وتحتاج تطبيقاً/بوابة منفصلة للمريض)
