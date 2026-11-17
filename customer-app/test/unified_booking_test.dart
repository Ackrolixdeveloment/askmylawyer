import 'package:flutter_test/flutter_test.dart';
import 'package:customer_app/features/bookings/booking_repository.dart';

void main() {
  test('unified booking is not labelled as a preselected video call', () {
    final booking = Booking.fromJson({
      'id': 'fixture',
      'planCode': 'consultation',
      'at': '2026-11-17T00:00:00Z',
    });
    expect(booking.modeLabel, 'Consultation');
    expect(booking.mode, CallMode.consultation);
  });
}
