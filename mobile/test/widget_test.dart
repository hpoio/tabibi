import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:medical_assistant_patient/main.dart';

void main() {
  testWidgets('التطبيق يبدأ بدون أخطاء', (WidgetTester tester) async {
    await tester.pumpWidget(const MedicalAssistantApp());
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}