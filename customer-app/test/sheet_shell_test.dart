import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:customer_app/features/settings/sheet_shell.dart';

void main() {
  testWidgets('account sheet scrolls on short screens instead of overflowing', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Align(
            alignment: Alignment.bottomCenter,
            child: SizedBox(
              height: 300,
              child: SheetShell(
                child: Column(
                  children: [
                    for (var i = 0; i < 20; i++)
                      Padding(
                        padding: const EdgeInsets.all(12),
                        child: Text('Account action $i'),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
    expect(tester.takeException(), isNull);
    await tester.drag(
      find.byType(SingleChildScrollView),
      const Offset(0, -1500),
    );
    await tester.pumpAndSettle();
    expect(find.text('Account action 19').hitTestable(), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
