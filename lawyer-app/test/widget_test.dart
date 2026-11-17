import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'package:lawyer_app/main.dart';

void main() {
  setUp(() => FlutterSecureStorage.setMockInitialValues({}));

  testWidgets('splash shows the brand lockup', (tester) async {
    await tester.pumpWidget(const LawyerApp());

    expect(find.text('LEGAL HELP, ON DEMAND'), findsOneWidget);
    expect(find.text('Bar Council verified advocates'), findsOneWidget);
    expect(find.byType(Image), findsOneWidget);

    // Finish the splash hold and navigation before disposing the widget tree.
    await tester.pump(const Duration(seconds: 3));
    await tester.pumpAndSettle();
    expect(find.text('Welcome to Ask My Lawyer'), findsOneWidget);
  });
}
