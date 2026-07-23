/// رابط الباك-إند. عدّله حسب بيئتك:
/// - محاكي أندرويد (Emulator): استخدم 10.0.2.2 بدل localhost
/// - جهاز حقيقي على نفس الشبكة: استخدم عنوان IP جهازك (مثال: 192.168.1.5)
/// - إنتاج: رابط السيرفر الحقيقي (https://api.yourdomain.dz)
const String kApiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://10.0.2.2:3000',
);
