import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:lawyer_app/main.dart';

void main() {
  testWidgets('splash shows the brand lockup', (tester) async {
    await tester.pumpWidget(const LawyerApp());

    expect(find.text('LEGAL HELP, ON DEMAND'), findsOneWidget);
    expect(find.text('Bar Council verified advocates'), findsOneWidget);
    expect(find.byType(Image), findsOneWidget);
  });
}
