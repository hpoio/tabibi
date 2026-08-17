import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';

  // فحص أمني إلزامي قبل الإقلاع: منع النشر بمفتاح JWT افتراضي أو ضعيف.
  // هذا خطأ شائع جداً (نسيان تغيير القيمة الافتراضية) ويؤدي لاختراق كامل للنظام.
  const jwtSecret = process.env.JWT_SECRET;
  if (isProduction && (!jwtSecret || jwtSecret.length < 32 || jwtSecret.includes('change_this'))) {
    throw new Error(
      'JWT_SECRET غير آمن للإنتاج: يجب أن يكون مفتاحاً عشوائياً بطول 32 حرفاً على الأقل. ' +
        'ولّد واحداً بالأمر: openssl rand -hex 32',
    );
  }

  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  // CORS: في الإنتاج نقبل فقط النطاقات المصرَّح بها صراحة عبر ALLOWED_ORIGINS
  // (قائمة مفصولة بفواصل، مثال: "https://app.tabibi.dz,https://tabibi-wheat.vercel.app").
  // في التطوير (بدون هذا المتغير) نسمح بأي نطاق لتسهيل العمل محلياً فقط.
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim());
  app.enableCors({
    origin: isProduction ? (allowedOrigins ?? false) : true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // توثيق API تفاعلي (Swagger) - مفيد أثناء التطوير فقط.
  // يُخفى تلقائياً في الإنتاج لتجنّب كشف بنية كل الـ APIs (بما فيها الطبية الحساسة) للعموم.
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Medical Assistant API')
      .setDescription('واجهة برمجية - تطبيق المساعد الطبي الذكي (الجزائر)')
      .setVersion('0.1')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Medical Assistant API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs on http://localhost:${port}/docs`);
}
bootstrap();
