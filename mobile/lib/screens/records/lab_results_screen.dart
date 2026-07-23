import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/models.dart';
import '../../services/api_client.dart';
import '../../theme/app_theme.dart';

class LabResultsScreen extends StatefulWidget {
  const LabResultsScreen({super.key});

  @override
  State<LabResultsScreen> createState() => _LabResultsScreenState();
}

class _LabResultsScreenState extends State<LabResultsScreen> {
  List<LabResultModel> _results = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await ApiClient.get('/me/lab-results');
      setState(() {
        _results = (res as List).map((e) => LabResultModel.fromJson(e)).toList();
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
        appBar: AppBar(title: const Text('نتائج تحاليلي')),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? Center(child: Text(_error!, style: const TextStyle(color: AppColors.danger)))
                : RefreshIndicator(
                    onRefresh: _load,
                    child: _results.isEmpty
                        ? ListView(children: const [
                            Padding(
                              padding: EdgeInsets.all(32),
                              child: Center(child: Text('لا توجد نتائج بعد', style: TextStyle(color: Colors.black45))),
                            ),
                          ])
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _results.length,
                            itemBuilder: (context, i) {
                              final r = _results[i];
                              return Card(
                                margin: const EdgeInsets.only(bottom: 10),
                                color: r.isAbnormal ? AppColors.danger.withOpacity(0.04) : null,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14),
                                  side: BorderSide(color: r.isAbnormal ? AppColors.danger.withOpacity(0.3) : AppColors.border),
                                ),
                                child: ListTile(
                                  title: Text(r.testName),
                                  subtitle: Text(DateFormat('d MMMM yyyy', 'ar').format(r.takenAt)),
                                  trailing: Text(
                                    '${r.value} ${r.unit}',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: r.isAbnormal ? AppColors.danger : AppColors.foreground,
                                    ),
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
