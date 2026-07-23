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

/// عميل HTTP بسيط يضيف تلقائياً رأس Authorization ويوحّد معالجة الأخطاء.
/// أي رد 401 يعني جلسة منتهية - يُترك للواجهة التعامل معه (إعادة توجيه لتسجيل الدخول).
class ApiClient {
  static Future<Map<String, String>> _headers({bool auth = true}) async {
    final headers = {'Content-Type': 'application/json'};
    if (auth) {
      final token = await SessionService.getToken();
      if (token != null) headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  static Future<dynamic> get(String path, {bool auth = true}) async {
    final res = await http.get(Uri.parse('$kApiBaseUrl$path'), headers: await _headers(auth: auth));
    return _handle(res);
  }

  static Future<dynamic> post(String path, {Map<String, dynamic>? body, bool auth = true}) async {
    final res = await http.post(
      Uri.parse('$kApiBaseUrl$path'),
      headers: await _headers(auth: auth),
      body: jsonEncode(body ?? {}),
    );
    return _handle(res);
  }

  static Future<dynamic> patch(String path, {Map<String, dynamic>? body, bool auth = true}) async {
    final res = await http.patch(
      Uri.parse('$kApiBaseUrl$path'),
      headers: await _headers(auth: auth),
      body: jsonEncode(body ?? {}),
    );
    return _handle(res);
  }

  static dynamic _handle(http.Response res) {
    if (res.statusCode == 401) {
      throw ApiException('انتهت الجلسة، يرجى تسجيل الدخول من جديد', 401);
    }
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
