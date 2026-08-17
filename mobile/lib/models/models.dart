class AppointmentModel {
  final String id;
  final String type;
  final String status;
  final DateTime scheduledAt;
  final String? doctorName;
  final String? clinicName;

  AppointmentModel({
    required this.id,
    required this.type,
    required this.status,
    required this.scheduledAt,
    this.doctorName,
    this.clinicName,
  });

  factory AppointmentModel.fromJson(Map<String, dynamic> json) => AppointmentModel(
        id: json['id'],
        type: json['type'],
        status: json['status'],
        scheduledAt: DateTime.parse(json['scheduledAt']),
        doctorName: json['doctor']?['user']?['fullName'],
        clinicName: json['doctor']?['clinicName'],
      );

  static const Map<String, String> typeLabels = {
    'NEW_CONSULTATION': 'كشف جديد',
    'FOLLOW_UP': 'كونترول',
    'LAB_TEST': 'تحاليل',
    'OTHER': 'أخرى',
  };

  String get typeLabel => typeLabels[type] ?? type;
}

class PrescriptionItemModel {
  final String drugName;
  final String dosage;
  final String duration;
  final String? notes;

  PrescriptionItemModel({required this.drugName, required this.dosage, required this.duration, this.notes});

  factory PrescriptionItemModel.fromJson(Map<String, dynamic> json) => PrescriptionItemModel(
        drugName: json['drugName'],
        dosage: json['dosage'],
        duration: json['duration'],
        notes: json['notes'],
      );
}

class PrescriptionModel {
  final String id;
  final DateTime createdAt;
  final List<PrescriptionItemModel> items;

  PrescriptionModel({required this.id, required this.createdAt, required this.items});

  factory PrescriptionModel.fromJson(Map<String, dynamic> json) => PrescriptionModel(
        id: json['id'],
        createdAt: DateTime.parse(json['createdAt']),
        items: (json['items'] as List).map((e) => PrescriptionItemModel.fromJson(e)).toList(),
      );
}

class LabResultModel {
  final String id;
  final String testName;
  final double value;
  final String unit;
  final bool isAbnormal;
  final DateTime takenAt;

  LabResultModel({
    required this.id,
    required this.testName,
    required this.value,
    required this.unit,
    required this.isAbnormal,
    required this.takenAt,
  });

  factory LabResultModel.fromJson(Map<String, dynamic> json) => LabResultModel(
        id: json['id'],
        testName: json['testName'],
        value: (json['value'] as num).toDouble(),
        unit: json['unit'],
        isAbnormal: json['isAbnormal'] ?? false,
        takenAt: DateTime.parse(json['takenAt']),
      );
}

class QrScanResultModel {
  final String patientFirstName;
  final List<PrescriptionItemModel> todayMedications;
  final AppointmentModel? nextAppointment;

  QrScanResultModel({
    required this.patientFirstName,
    required this.todayMedications,
    this.nextAppointment,
  });

  factory QrScanResultModel.fromJson(Map<String, dynamic> json) => QrScanResultModel(
        patientFirstName: json['patientFirstName'] ?? '',
        todayMedications: (json['todayMedications'] as List? ?? [])
            .map((e) => PrescriptionItemModel.fromJson(e))
            .toList(),
        nextAppointment:
            json['nextAppointment'] != null ? AppointmentModel.fromJson(json['nextAppointment']) : null,
      );
}

/// سطر اقتراح واحد من نتيجة OCR الخام - غير مؤكد بعد (raw من الخادم قبل
/// أي مراجعة بشرية). يطابق ParsedLabLine في الباك-إند (ocr.service.ts).
class OcrSuggestionModel {
  final String rawLine;
  final String? testNameGuess;
  final double? valueGuess;
  final String? unitGuess;

  OcrSuggestionModel({required this.rawLine, this.testNameGuess, this.valueGuess, this.unitGuess});

  factory OcrSuggestionModel.fromJson(Map<String, dynamic> json) => OcrSuggestionModel(
        rawLine: json['rawLine'] ?? '',
        testNameGuess: json['testNameGuess'],
        valueGuess: json['valueGuess'] != null ? (json['valueGuess'] as num).toDouble() : null,
        unitGuess: json['unitGuess'],
      );
}

/// طلب مراجعة تحليل رفعه المريض بنفسه (صورة → OCR) بانتظار موافقة الطبيب.
/// لا يظهر كـ LabResult حقيقي في "نتائج تحاليلي" إلا بعد أن يوافق الطبيب
/// عليه صراحة (POST /lab-result-requests/:id/approve من جهة الطبيب).
class LabResultRequestModel {
  final String id;
  final String status; // PENDING | APPROVED | REJECTED
  final String rawText;
  final List<OcrSuggestionModel> suggestions;
  final String? reviewNote;
  final DateTime createdAt;

  LabResultRequestModel({
    required this.id,
    required this.status,
    required this.rawText,
    required this.suggestions,
    this.reviewNote,
    required this.createdAt,
  });

  factory LabResultRequestModel.fromJson(Map<String, dynamic> json) => LabResultRequestModel(
        id: json['id'],
        status: json['status'] ?? 'PENDING',
        rawText: json['rawText'] ?? '',
        suggestions: (json['suggestions'] as List? ?? [])
            .map((e) => OcrSuggestionModel.fromJson(e))
            .toList(),
        reviewNote: json['reviewNote'],
        createdAt: DateTime.parse(json['createdAt']),
      );

  static const Map<String, String> statusLabels = {
    'PENDING': 'قيد المراجعة',
    'APPROVED': 'تمت الموافقة',
    'REJECTED': 'مرفوض',
  };

  String get statusLabel => statusLabels[status] ?? status;
}

class ChatMessageModel {
  final String sender; // patient | ai
  final String message;
  final bool escalated;

  ChatMessageModel({required this.sender, required this.message, this.escalated = false});

  factory ChatMessageModel.fromJson(Map<String, dynamic> json) => ChatMessageModel(
        sender: json['sender'],
        message: json['message'],
        escalated: json['escalated'] ?? false,
      );
}
