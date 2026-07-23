import 'package:flutter/material.dart';

/// نفس نظام الألوان المستخدم في الويب (web/app/globals.css) بالضبط،
/// حتى تكون الهوية البصرية موحّدة بين المنصتين.
class AppColors {
  static const primary = Color(0xFF0A5C8C);
  static const primaryDark = Color(0xFF084A70);
  static const accent = Color(0xFF4FB6E8);
  static const accentSoft = Color(0xFFE6F4FB);
  static const danger = Color(0xFFE63946);
  static const success = Color(0xFF2FA98C);
  static const background = Color(0xFFFFFFFF);
  static const backgroundSoft = Color(0xFFF7F9FB);
  static const foreground = Color(0xFF1E2A33);
  static const border = Color(0xFFE2E8EE);
}

ThemeData buildAppTheme() {
  return ThemeData(
    useMaterial3: true,
    fontFamily: 'Tajawal',
    scaffoldBackgroundColor: AppColors.backgroundSoft,
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.primary,
      primary: AppColors.primary,
      error: AppColors.danger,
      surface: AppColors.background,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.background,
      foregroundColor: AppColors.foreground,
      elevation: 0,
      centerTitle: true,
    ),
    cardTheme: CardThemeData(
      color: AppColors.background,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: AppColors.border),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.background,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.accent, width: 1.5),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        minimumSize: const Size.fromHeight(48),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: const TextStyle(fontFamily: 'Tajawal', fontWeight: FontWeight.w700),
      ),
    ),
  );
}
