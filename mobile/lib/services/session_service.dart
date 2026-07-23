import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class AppUser {
  final String id;
  final String fullName;
  final String phone;
  final String role;

  AppUser({required this.id, required this.fullName, required this.phone, required this.role});

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
        id: json['id'],
        fullName: json['fullName'],
        phone: json['phone'],
        role: json['role'],
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'fullName': fullName,
        'phone': phone,
        'role': role,
      };
}

/// إدارة الجلسة محلياً عبر SharedPreferences (مناسب لتوكن JWT في تطبيق موبايل
/// بسيط؛ للإنتاج الحقيقي يُفضَّل flutter_secure_storage للتخزين المشفّر).
class SessionService {
  static const _tokenKey = 'access_token';
  static const _userKey = 'current_user';

  static Future<void> save(String token, AppUser user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_userKey, jsonEncode(user.toJson()));
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  static Future<AppUser?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_userKey);
    if (raw == null) return null;
    return AppUser.fromJson(jsonDecode(raw));
  }

  static Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
  }
}
