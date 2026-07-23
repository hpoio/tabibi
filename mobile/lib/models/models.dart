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
