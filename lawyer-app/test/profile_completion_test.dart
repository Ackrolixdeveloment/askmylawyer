import 'package:flutter_test/flutter_test.dart';
import 'package:lawyer_app/features/home/home_repository.dart';
import 'package:lawyer_app/core/widgets/step_header.dart';

void main() {
  test('dashboard uses server completion rather than a fixed percentage', () {
    expect(
      HomeData.fromJson({
        'profileCompletion': {'percent': 80},
      }).profileCompletionPercent,
      80,
    );
    expect(
      HomeData.fromJson({
        'profileCompletion': {'percent': 100},
      }).profileCompletionPercent,
      100,
    );
    expect(HomeData.fromJson({}).profileCompletionPercent, isNull);
    expect(totalOnboardingSteps, 4);
  });
}
