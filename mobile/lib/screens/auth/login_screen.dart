import 'package:flutter/material.dart';
import '../../services/api_client.dart';
import '../../services/session_service.dart';
import '../../theme/app_theme.dart';
import '../home/home_screen.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _loading = false;
  String? _error;

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final res = await ApiClient.post(
        '/auth/login',
        auth: false,
        body: {'phone': _phoneController.text.trim(), 'password': _passwordController.text},
      );
      final user = AppUser.fromJson(res['user']);
      await SessionService.save(res['accessToken'], res['refreshToken'], user);

      if (!mounted) return;
      Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const HomeScreen()));
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'تعذّر الاتصال بالخادم. تأكد من اتصالك بالإنترنت.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Icon(Icons.health_and_safety, color: Colors.white, size: 36),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'المساعد الطبي الذكي',
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.primary),
                    ),
                    const SizedBox(height: 4),
                    const Text('تطبيق المريض', style: TextStyle(color: Colors.black54)),
                    const SizedBox(height: 32),
                    if (_error != null) ...[
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.danger.withValues(alpha: 0.06),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.danger.withValues(alpha: 0.2)),
                        ),
                        child: Text(_error!, style: const TextStyle(color: AppColors.danger, fontSize: 13)),
                      ),
                      const SizedBox(height: 16),
                    ],
                    TextFormField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      textDirection: TextDirection.ltr,
                      decoration: const InputDecoration(labelText: 'رقم الهاتف', prefixIcon: Icon(Icons.phone)),
                      validator: (v) => (v == null || v.isEmpty) ? 'مطلوب' : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _passwordController,
                      obscureText: true,
                      decoration: const InputDecoration(labelText: 'كلمة المرور', prefixIcon: Icon(Icons.lock_outline)),
                      validator: (v) => (v == null || v.isEmpty) ? 'مطلوب' : null,
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton(
                      onPressed: _loading ? null : _handleLogin,
                      child: _loading
                          ? const SizedBox(
                              width: 20, height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Text('تسجيل الدخول'),
                    ),
                    const SizedBox(height: 12),
                    TextButton(
                      onPressed: () => Navigator.of(context)
                          .push(MaterialPageRoute(builder: (_) => const RegisterScreen())),
                      child: const Text('ليس لديك حساب؟ سجّل الآن'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
