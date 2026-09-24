import 'package:flutter_test/flutter_test.dart';

import 'package:customer_app/main.dart';

void main() {
  testWidgets('boots into the splash screen', (WidgetTester tester) async {
    await tester.pumpWidget(const CustomerApp());

    // The splash holds before handing over to onboarding.
    expect(find.text('LEGAL HELP, ON DEMAND'), findsOneWidget);

    // Let the hold and the stored-session lookup run out, so neither is
    // left pending when the test ends.
    await tester.pump(const Duration(seconds: 3));
    await tester.pumpAndSettle();
  });

  testWidgets('splash hands over to onboarding', (WidgetTester tester) async {
    await tester.pumpWidget(const CustomerApp());

    // Past the 2s hold, then settle the page transition.
    await tester.pump(const Duration(seconds: 3));
    await tester.pumpAndSettle();

    expect(find.text('Welcome to Ask My Lawyer'), findsOneWidget);
    expect(find.text('Skip'), findsOneWidget);
  });
}
