import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart' hide TextDirection;
import '../../models/models.dart';
import '../../services/api_client.dart';
import '../../theme/app_theme.dart';
import '../auth/login_screen.dart';

/// شاشة رفع صورة تحليل مخبري.
///
/// ⚠️ ملاحظة معمارية مهمة: المريض لا يملك صلاحية إنشاء نتيجة تحليل (LabResult)
/// مباشرة في النظام - هذا قرار أمان/سلامة بيانات طبية متعمَّد (راجع
/// backend/src/lab-result-requests). لذلك هذه الشاشة لا "تضيف نتيجة" فوراً؛
/// بل ترفع الصورة، يستخرج الخادم نصاً واقتراحات عبر OCR، وتُحفظ كـ"طلب
/// معلّق" (LabResultRequest) بانتظار أن يراجعه الطبيب المعالج ويوافق عليه
/// (فيظهر عندها فعلاً في "نتائج تحاليلي") أو يرفضه. القسم السفلي من هذه
/// الشاشة يعرض حالة كل طلب سابق حتى يعرف المريض أين وصلت مراجعته.
class OcrUploadScreen extends StatefulWidget {
  const OcrUploadScreen({super.key});

  @override
  State<OcrUploadScreen> createState() => _OcrUploadScreenState();
}

class _OcrUploadScreenState extends State<OcrUploadScreen> {
  final ImagePicker _picker = ImagePicker();

  bool _uploading = false;
  String? _uploadError;
  List<OcrSuggestionModel>? _lastSuggestions; // نتيجة آخر رفع ناجح، للعرض فوراً

  List<LabResultRequestModel> _history = [];
  bool _historyLoading = true;
  String? _historyError;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    setState(() {
      _historyLoading = true;
      _historyError = null;
    });
    try {
      final res = await ApiClient.get('/lab-result-requests/mine');
      _history = (res as List).map((e) => LabResultRequestModel.fromJson(e)).toList();
    } on SessionExpiredException {
      _goToLogin();
      return;
    } on ApiException catch (e) {
      _historyError = e.message;
    } catch (_) {
      _historyError = 'تعذّر تحميل طلباتك السابقة';
    } finally {
      if (mounted) setState(() => _historyLoading = false);
    }
  }

  void _goToLogin() {
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  Future<void> _pickAndUpload(ImageSource source) async {
    final XFile? picked = await _picker.pickImage(source: source, imageQuality: 85);
    if (picked == null) return;

    setState(() {
      _uploading = true;
      _uploadError = null;
      _lastSuggestions = null;
    });

    try {
      final res = await ApiClient.uploadFile(
        '/ocr/lab-result-request',
        fieldName: 'file',
        filePath: picked.path,
      );
      final request = LabResultRequestModel.fromJson(res);
      if (!mounted) return;
      setState(() => _lastSuggestions = request.suggestions);
      await _loadHistory();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تم إرسال الصورة، بانتظار مراجعة طبيبك')),
      );
    } on SessionExpiredException {
      _goToLogin();
      return;
    } on ApiException catch (e) {
      setState(() => _uploadError = e.message);
    } catch (_) {
      setState(() => _uploadError = 'تعذّر رفع الصورة، تحقق من اتصالك وحاول مجدداً');
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  void _showSourceSheet() {
    showModalBottomSheet(
      context: context,
      builder: (_) => Directionality(
        textDirection: TextDirection.rtl,
        child: SafeArea(
          child: Wrap(
            children: [
              ListTile(
                leading: const Icon(Icons.photo_camera_outlined, color: AppColors.primary),
                title: const Text('التقاط صورة بالكاميرا'),
                onTap: () {
                  Navigator.pop(context);
                  _pickAndUpload(ImageSource.camera);
                },
              ),
              ListTile(
                leading: const Icon(Icons.photo_library_outlined, color: AppColors.primary),
                title: const Text('اختيار من المعرض'),
                onTap: () {
                  Navigator.pop(context);
                  _pickAndUpload(ImageSource.gallery);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(title: const Text('رفع صورة تحليل')),
        body: RefreshIndicator(
          onRefresh: _loadHistory,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.accentSoft,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.info_outline, color: AppColors.primary, size: 20),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'الصورة تُرسل لطبيبك المعالج للمراجعة والموافقة قبل أن تظهر كنتيجة تحليل رسمية.',
                        style: TextStyle(fontSize: 12.5, color: AppColors.foreground),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              ElevatedButton.icon(
                onPressed: _uploading ? null : _showSourceSheet,
                icon: _uploading
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.upload_file),
                label: Text(_uploading ? 'جارٍ الرفع...' : 'رفع صورة تحليل جديدة'),
              ),

              if (_uploadError != null) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.danger.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(_uploadError!, style: const TextStyle(color: AppColors.danger, fontSize: 13)),
                ),
              ],

              if (_lastSuggestions != null) ...[
                const SizedBox(height: 20),
                const Text('ما استطعنا قراءته من الصورة (اقتراحات غير مؤكدة بعد)',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                const SizedBox(height: 8),
                if (_lastSuggestions!.isEmpty)
                  const Text('لم نتمكن من قراءة أي سطر واضح من الصورة',
                      style: TextStyle(color: Colors.black45))
                else
                  ..._lastSuggestions!.map(
                    (s) => Card(
                      child: ListTile(
                        dense: true,
                        title: Text(s.testNameGuess ?? s.rawLine),
                        subtitle: s.valueGuess != null
                            ? Text('${s.valueGuess} ${s.unitGuess ?? ''}')
                            : Text(s.rawLine, style: const TextStyle(color: Colors.black45)),
                      ),
                    ),
                  ),
              ],

              const SizedBox(height: 28),
              const Text('طلباتي السابقة', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 8),

              if (_historyLoading)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (_historyError != null)
                Text(_historyError!, style: const TextStyle(color: AppColors.danger))
              else if (_history.isEmpty)
                const Text('لم ترفع أي صورة تحليل بعد', style: TextStyle(color: Colors.black45))
              else
                ..._history.map((r) => _RequestTile(request: r)),
            ],
          ),
        ),
      ),
    );
  }
}

class _RequestTile extends StatelessWidget {
  final LabResultRequestModel request;
  const _RequestTile({required this.request});

  Color get _statusColor {
    switch (request.status) {
      case 'APPROVED':
        return AppColors.success;
      case 'REJECTED':
        return AppColors.danger;
      default:
        return Colors.orange;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ExpansionTile(
        title: Text(DateFormat('d MMMM yyyy، HH:mm', 'ar').format(request.createdAt)),
        subtitle: Text(
          request.status == 'PENDING'
              ? '${request.suggestions.length} سطر مستخرج، بانتظار المراجعة'
              : request.statusLabel,
        ),
        leading: Container(
          width: 10,
          height: 10,
          margin: const EdgeInsets.only(top: 6),
          decoration: BoxDecoration(color: _statusColor, shape: BoxShape.circle),
        ),
        trailing: Chip(
          label: Text(request.statusLabel, style: const TextStyle(fontSize: 11, color: Colors.white)),
          backgroundColor: _statusColor,
          padding: EdgeInsets.zero,
          materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
        ),
        children: [
          if (request.reviewNote != null && request.reviewNote!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Align(
                alignment: Alignment.centerRight,
                child: Text('ملاحظة الطبيب: ${request.reviewNote}',
                    style: const TextStyle(fontStyle: FontStyle.italic, fontSize: 13)),
              ),
            ),
          if (request.suggestions.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Align(
                alignment: Alignment.centerRight,
                child: Text('لا توجد أسطر مقروءة من الصورة', style: TextStyle(color: Colors.black45)),
              ),
            )
          else
            ...request.suggestions.map(
              (s) => ListTile(
                dense: true,
                title: Text(s.testNameGuess ?? s.rawLine),
                subtitle: s.valueGuess != null ? Text('${s.valueGuess} ${s.unitGuess ?? ''}') : null,
              ),
            ),
        ],
      ),
    );
  }
}
