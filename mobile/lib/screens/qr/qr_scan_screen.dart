import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:intl/intl.dart' hide TextDirection;
import '../../models/models.dart';
import '../../services/api_client.dart';
import '../../theme/app_theme.dart';

/// شاشة مسح رمز QR الخاص بالمريض. لا تتطلب تسجيل دخول من طرف الماسح
/// (endpoint `/qr/:code` عام عمداً على الخادم لسير عمل الممرضة/المرافق) -
/// لذلك تعمل هذه الشاشة حتى بدون جلسة نشطة على هذا الجهاز.
class QrScanScreen extends StatefulWidget {
  const QrScanScreen({super.key});

  @override
  State<QrScanScreen> createState() => _QrScanScreenState();
}

class _QrScanScreenState extends State<QrScanScreen> {
  final MobileScannerController _controller = MobileScannerController();
  bool _torchOn = false;
  bool _busy = false; // يمنع معالجة نفس الرمز عدة مرات أثناء رد الخادم
  String? _error;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _handleDetect(BarcodeCapture capture) async {
    if (_busy) return;
    final code = capture.barcodes.firstOrNull?.rawValue;
    if (code == null || code.isEmpty) return;

    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      // الرمز الممسوح هو qrCodeId مباشرة (UUID) - لا يحتاج مصادقة (auth: false)
      final res = await ApiClient.get('/qr/$code', auth: false);
      final result = QrScanResultModel.fromJson(res);
      if (!mounted) return;
      await Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => _QrResultScreen(result: result)),
      );
    } on ApiException catch (e) {
      setState(() => _error = e.statusCode == 404 ? 'رمز QR غير صالح أو منتهي' : e.message);
    } catch (_) {
      setState(() => _error = 'تعذّر قراءة الرمز، حاول مجدداً');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          title: const Text('مسح رمز QR'),
          backgroundColor: Colors.black,
          foregroundColor: Colors.white,
          actions: [
            IconButton(
              icon: Icon(_torchOn ? Icons.flash_on : Icons.flash_off),
              onPressed: () {
                _controller.toggleTorch();
                setState(() => _torchOn = !_torchOn);
              },
            ),
          ],
        ),
        body: Stack(
          alignment: Alignment.center,
          children: [
            MobileScanner(controller: _controller, onDetect: _handleDetect),

            // إطار مسح بصري بسيط لمساعدة المستخدم على توسيط الرمز
            Container(
              width: 240,
              height: 240,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.white, width: 2),
                borderRadius: BorderRadius.circular(16),
              ),
            ),

            if (_busy)
              const Positioned(
                bottom: 60,
                child: CircularProgressIndicator(color: Colors.white),
              ),

            if (_error != null)
              Positioned(
                bottom: 40,
                left: 24,
                right: 24,
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.danger,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    _error!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.white),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

extension _FirstOrNull<T> on List<T> {
  T? get firstOrNull => isEmpty ? null : first;
}

/// شاشة عرض نتيجة المسح: أدوية اليوم + الموعد القادم فقط (بتصميم الخادم المتعمَّد).
class _QrResultScreen extends StatelessWidget {
  final QrScanResultModel result;
  const _QrResultScreen({required this.result});

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(title: Text('بطاقة ${result.patientFirstName}')),
        body: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text('أدوية اليوم', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            if (result.todayMedications.isEmpty)
              const Text('لا توجد وصفة مسجّلة حالياً', style: TextStyle(color: Colors.black45))
            else
              ...result.todayMedications.map(
                (m) => Card(
                  child: ListTile(
                    leading: const Icon(Icons.medication_outlined, color: AppColors.primary),
                    title: Text(m.drugName),
                    subtitle: Text('${m.dosage} — ${m.duration}'),
                  ),
                ),
              ),
            const SizedBox(height: 24),
            const Text('الموعد القادم', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            if (result.nextAppointment == null)
              const Text('لا يوجد موعد قادم', style: TextStyle(color: Colors.black45))
            else
              Card(
                child: ListTile(
                  leading: const Icon(Icons.calendar_today, color: AppColors.primary),
                  title: Text(DateFormat('EEEE d MMMM، HH:mm', 'ar').format(result.nextAppointment!.scheduledAt)),
                  subtitle: Text(result.nextAppointment!.typeLabel),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
