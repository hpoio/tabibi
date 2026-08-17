import 'package:flutter/material.dart';
import 'package:intl/intl.dart' hide TextDirection;
import '../../models/models.dart';
import '../../services/api_client.dart';
import '../../services/session_service.dart';
import '../../theme/app_theme.dart';
import '../auth/login_screen.dart';
import '../chat/chat_screen.dart';
import '../records/prescriptions_screen.dart';
import '../records/lab_results_screen.dart';
import '../qr/qr_scan_screen.dart';
import '../ocr/ocr_upload_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<AppointmentModel> _appointments = [];
  bool _loading = true;
  String? _error;
  AppUser? _user;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      _user = await SessionService.getUser();
      final res = await ApiClient.get('/me/appointments');
      _appointments = (res as List).map((e) => AppointmentModel.fromJson(e)).toList();
    } on SessionExpiredException {
      _goToLogin();
      return;
    } on ApiException catch (e) {
      _error = e.message;
    } catch (_) {
      _error = 'تعذّر تحميل بياناتك. تأكد من اتصالك بالخادم.';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _goToLogin() {
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  Future<void> _logout() async {
    await ApiClient.logout();
    if (mounted) _goToLogin();
  }

  @override
  Widget build(BuildContext context) {
    final next = _appointments.isNotEmpty ? _appointments.first : null;

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: Text('مرحباً ${_user?.fullName.split(' ').first ?? ''}'),
          actions: [
            IconButton(onPressed: _logout, icon: const Icon(Icons.logout)),
          ],
        ),
        body: RefreshIndicator(
          onRefresh: _load,
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    if (_error != null)
                      Container(
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: AppColors.danger.withValues(alpha: 0.06),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(_error!, style: const TextStyle(color: AppColors.danger, fontSize: 13)),
                      ),

                    // بطاقة الموعد القادم
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: next == null
                            ? const Text('لا يوجد موعد قادم مسجّل حالياً', style: TextStyle(color: Colors.black54))
                            : Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Row(
                                    children: [
                                       Icon(Icons.calendar_today, color: AppColors.primary, size: 18),
                                       SizedBox(width: 8),
                                       Text('موعدك القادم', style: TextStyle(fontWeight: FontWeight.bold)),
                                    ],
                                  ),
                                  const SizedBox(height: 10),
                                  Text(
                                    DateFormat('EEEE d MMMM، HH:mm', 'ar').format(next.scheduledAt),
                                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                  ),
                                  const SizedBox(height: 4),
                                  Text('${next.typeLabel} — ${next.doctorName ?? ''}',
                                      style: const TextStyle(color: Colors.black54)),
                                ],
                              ),
                      ),
                    ),

                    const SizedBox(height: 20),

                    // وصول سريع
                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 1.3,
                      children: [
                        _QuickTile(
                          icon: Icons.smart_toy_outlined,
                          label: 'المساعد الصحي',
                          onTap: () => Navigator.of(context)
                              .push(MaterialPageRoute(builder: (_) => const ChatScreen())),
                        ),
                        _QuickTile(
                          icon: Icons.medication_outlined,
                          label: 'وصفاتي',
                          onTap: () => Navigator.of(context)
                              .push(MaterialPageRoute(builder: (_) => const PrescriptionsScreen())),
                        ),
                        _QuickTile(
                          icon: Icons.science_outlined,
                          label: 'نتائج تحاليلي',
                          onTap: () => Navigator.of(context)
                              .push(MaterialPageRoute(builder: (_) => const LabResultsScreen())),
                        ),
                        _QuickTile(
                          icon: Icons.qr_code_scanner,
                          label: 'مسح رمز QR',
                          onTap: () => Navigator.of(context)
                              .push(MaterialPageRoute(builder: (_) => const QrScanScreen())),
                        ),
                        _QuickTile(
                          icon: Icons.upload_file_outlined,
                          label: 'رفع صورة تحليل',
                          onTap: () => Navigator.of(context)
                              .push(MaterialPageRoute(builder: (_) => const OcrUploadScreen())),
                        ),
                      ],
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}

class _QuickTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _QuickTile({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(color: AppColors.accentSoft, borderRadius: BorderRadius.circular(12)),
                child: Icon(icon, color: AppColors.primary),
              ),
              const SizedBox(height: 8),
              Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ),
    );
  }
}
