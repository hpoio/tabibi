import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/models.dart';
import '../../services/api_client.dart';
import '../../theme/app_theme.dart';

class PrescriptionsScreen extends StatefulWidget {
  const PrescriptionsScreen({super.key});

  @override
  State<PrescriptionsScreen> createState() => _PrescriptionsScreenState();
}

class _PrescriptionsScreenState extends State<PrescriptionsScreen> {
  List<PrescriptionModel> _prescriptions = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await ApiClient.get('/me/prescriptions');
      setState(() {
        _prescriptions = (res as List).map((e) => PrescriptionModel.fromJson(e)).toList();
        _loading = false;
      });
    } on ApiException catch (e) {
      setState(() {
        _error = e.message;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(title: const Text('وصفاتي')),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? Center(child: Text(_error!, style: const TextStyle(color: AppColors.danger)))
                : RefreshIndicator(
                    onRefresh: _load,
                    child: _prescriptions.isEmpty
                        ? ListView(children: const [
                            Padding(
                              padding: EdgeInsets.all(32),
                              child: Center(child: Text('لا توجد وصفات بعد', style: TextStyle(color: Colors.black45))),
                            ),
                          ])
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _prescriptions.length,
                            itemBuilder: (context, i) {
                              final p = _prescriptions[i];
                              return Card(
                                margin: const EdgeInsets.only(bottom: 12),
                                child: Padding(
                                  padding: const EdgeInsets.all(14),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        DateFormat('d MMMM yyyy', 'ar').format(p.createdAt),
                                        style: const TextStyle(fontSize: 12, color: Colors.black45),
                                      ),
                                      const SizedBox(height: 8),
                                      ...p.items.map((item) => Padding(
                                            padding: const EdgeInsets.only(bottom: 4),
                                            child: Text('• ${item.drugName} — ${item.dosage} — ${item.duration}'),
                                          )),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                  ),
      ),
    );
  }
}
