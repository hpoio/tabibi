import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config.dart';
import 'session_service.dart';

class ApiException implements Exception {
  final String message;
  final int statusCode;
  ApiException(this.message, this.statusCode);
  @override
  String toString() => message;
}

/// يُرمى عندما تفشل محاولة تجديد الجلسة نفسها (refresh token منتهي/ملغى) -
/// هذا هو الإشارة الوحيدة الصحيحة لإجبار المستخدم على تسجيل الدخول من جديد.
/// أي 401 عادي على طلب آخر يُعالَج تلقائياً بمحاولة تجديد أولاً (راجع _handle).
class SessionExpiredException implements Exception {}

/// عميل HTTP بسيط يضيف تلقائياً رأس Authorization ويوحّد معالجة الأخطاء.
///
/// منذ تحديث الخادم، accessToken صار قصير العمر (ساعة واحدة) بدل 7 أيام،
/// معتمداً على refreshToken (30 يوماً) للتجديد التلقائي. لذلك أي رد 401
/// هنا لا يعني بالضرورة "سجّل خروج" — أولاً نحاول تجديد الجلسة صامتاً عبر
/// POST /auth/refresh وإعادة الطلب الأصلي مرة واحدة؛ فقط إذا فشل التجديد
/// نفسه نرمي SessionExpiredException لتوجيه المستخدم لشاشة تسجيل الدخول.
class ApiClient {
  // يمنع محاولات تجديد متزامنة متعددة إذا وصلت عدة طلبات 401 في نفس اللحظة
  static Future<bool>? _refreshInFlight;

  static Future<Map<String, String>> _headers({bool auth = true}) async {
    final headers = {'Content-Type': 'application/json'};
    if (auth) {
      final token = await SessionService.getToken();
      if (token != null) headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  static Future<dynamic> get(String path, {bool auth = true}) {
    return _withAutoRefresh(
      auth,
      () async => http.get(Uri.parse('$kApiBaseUrl$path'), headers: await _headers(auth: auth)),
    );
  }

  static Future<dynamic> post(String path, {Map<String, dynamic>? body, bool auth = true}) {
    return _withAutoRefresh(
      auth,
      () async => http.post(
        Uri.parse('$kApiBaseUrl$path'),
        headers: await _headers(auth: auth),
        body: jsonEncode(body ?? {}),
      ),
    );
  }

  /// رفع ملف (multipart/form-data) - مثال: صورة تحليل لـ OCR. يمرّ بنفس
  /// آلية التجديد التلقائي للجلسة (_withAutoRefresh) كباقي الطلبات، لأن
  /// إعادة إنشاء http.MultipartRequest (وليس http.Response) في كل محاولة
  /// ضرورية لأن جسم multipart لا يمكن إرساله مرتين.
  static Future<dynamic> uploadFile(
    String path, {
    required String fieldName,
    required String filePath,
    bool auth = true,
  }) {
    return _withAutoRefresh(auth, () async {
      final uri = Uri.parse('$kApiBaseUrl$path');
      final request = http.MultipartRequest('POST', uri);
      final headers = await _headers(auth: auth);
      headers.remove('Content-Type'); // multipart يحدد boundary تلقائياً
      request.headers.addAll(headers);
      request.files.add(await http.MultipartFile.fromPath(fieldName, filePath));
      final streamed = await request.send();
      return http.Response.fromStream(streamed);
    });
  }

  static Future<dynamic> patch(String path, {Map<String, dynamic>? body, bool auth = true}) {
    return _withAutoRefresh(
      auth,
      () async => http.patch(
        Uri.parse('$kApiBaseUrl$path'),
        headers: await _headers(auth: auth),
        body: jsonEncode(body ?? {}),
      ),
    );
  }

  /// ينفّذ الطلب، وإن رجع 401 وكان مصادَقاً (auth=true)، يحاول تجديد الجلسة
  /// مرة واحدة فقط ثم يعيد نفس الطلب. لا تكرار لا نهائي مهما حدث.
  static Future<dynamic> _withAutoRefresh(bool auth, Future<http.Response> Function() request) async {
    final res = await request();
    if (res.statusCode != 401 || !auth) {
      return _handle(res);
    }

    final refreshed = await _refreshSession();
    if (!refreshed) {
      await SessionService.clear();
      throw SessionExpiredException();
    }

    final retryRes = await request();
    return _handle(retryRes);
  }

  static Future<bool> _refreshSession() {
    // إن كان هناك تجديد جارٍ فعلاً (طلب آخر بدأه للتو)، ننتظر نتيجته بدل
    // إطلاق طلب /auth/refresh مكرر - refresh token يُدوَّر مرة واحدة فقط،
    // فطلبان متزامنان سيُفشلان بعضهما البعض دون هذا القفل.
    _refreshInFlight ??= _doRefresh();
    return _refreshInFlight!.whenComplete(() => _refreshInFlight = null);
  }

  static Future<bool> _doRefresh() async {
    final refreshToken = await SessionService.getRefreshToken();
    if (refreshToken == null) return false;

    try {
      final res = await http.post(
        Uri.parse('$kApiBaseUrl/auth/refresh'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refreshToken': refreshToken}),
      );
      if (res.statusCode < 200 || res.statusCode >= 300) return false;

      final data = jsonDecode(utf8.decode(res.bodyBytes));
      await SessionService.updateTokens(data['accessToken'], data['refreshToken']);
      return true;
    } catch (_) {
      // خطأ شبكة أثناء التجديد: لا نُسجّل خروج المستخدم بسبب انقطاع مؤقت
      // في الإنترنت - نُبقي الجلسة القديمة، الطلب التالي سيحاول من جديد.
      return false;
    }
  }

  /// تسجيل خروج كامل: يُلغي الجلسة على الخادم (best-effort) ثم يمسحها محلياً.
  static Future<void> logout() async {
    final refreshToken = await SessionService.getRefreshToken();
    if (refreshToken != null) {
      try {
        await http.post(
          Uri.parse('$kApiBaseUrl/auth/logout'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'refreshToken': refreshToken}),
        );
      } catch (_) {
        // فشل إلغاء الجلسة على الخادم (مثلاً بلا إنترنت) لا يجب أن يمنع
        // المستخدم من الخروج محلياً من التطبيق.
      }
    }
    await SessionService.clear();
  }

  static dynamic _handle(http.Response res) {
    if (res.statusCode < 200 || res.statusCode >= 300) {
      String message = 'خطأ في الاتصال بالخادم (${res.statusCode})';
      try {
        final body = jsonDecode(res.body);
        final m = body['message'];
        message = m is List ? m.join('، ') : (m ?? message);
      } catch (_) {
        /* الرد ليس JSON - نستخدم الرسالة الافتراضية */
      }
      throw ApiException(message, res.statusCode);
    }
    if (res.body.isEmpty) return null;
    return jsonDecode(utf8.decode(res.bodyBytes));
  }
}
