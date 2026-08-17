import 'package:flutter/material.dart';
import '../../services/api_client.dart';
import '../../services/session_service.dart';
import '../../theme/app_theme.dart';
import '../home/home_screen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _loading = false;
  String? _error;

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final res = await ApiClient.post(
        '/auth/register',
        auth: false,
        body: {
          'fullName': _nameController.text.trim(),
          'phone': _phoneController.text.trim(),
          'password': _passwordController.text,
          'role': 'PATIENT',
        },
      );
      final user = AppUser.fromJson(res['user']);
      await SessionService.save(res['accessToken'], res['refreshToken'], user);

      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const HomeScreen()),
        (route) => false,
      );
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'تعذّر الاتصال بالخادم.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(title: const Text('حساب جديد')),
        body: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // إن كان طبيبك قد سجّلك مسبقاً بنفس رقم الهاتف، سيُربط
                  // هذا الحساب تلقائياً بملفك الطبي الموجود لديه.
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.accentSoft,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      'إن كان طبيبك قد سجّلك سابقاً بنفس رقم الهاتف، سيُربط حسابك تلقائياً بملفك الطبي.',
                      style: TextStyle(fontSize: 12, color: AppColors.foreground),
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (_error != null) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.danger.withValues(alpha: 0.06),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(_error!, style: const TextStyle(color: AppColors.danger, fontSize: 13)),
                    ),
                    const SizedBox(height: 16),
                  ],
                  TextFormField(
                    controller: _nameController,
                    decoration: const InputDecoration(labelText: 'الاسم الكامل'),
                    validator: (v) => (v == null || v.isEmpty) ? 'مطلوب' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    textDirection: TextDirection.ltr,
                    decoration: const InputDecoration(labelText: 'رقم الهاتف'),
                    validator: (v) => (v == null || v.isEmpty) ? 'مطلوب' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _passwordController,
                    obscureText: true,
                    decoration: const InputDecoration(labelText: 'كلمة المرور (8 أحرف على الأقل، حروف وأرقام)'),
                    validator: (v) {
                      if (v == null || v.length < 8) return '8 أحرف على الأقل';
                      final hasLetter = RegExp(r'[A-Za-z\u0600-\u06FF]').hasMatch(v);
                      final hasDigit = RegExp(r'\d').hasMatch(v);
                      if (!hasLetter || !hasDigit) return 'يجب أن تحتوي على حروف وأرقام معاً';
                      return null;
                    },
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: _loading ? null : _handleRegister,
                    child: _loading
                        ? const SizedBox(
                            width: 20, height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Text('إنشاء الحساب'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
