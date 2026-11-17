import 'package:flutter_test/flutter_test.dart';

import 'package:customer_app/features/bookings/booking_repository.dart';

void main() {
  Booking booking(String status) => Booking(
    id: 'fixture',
    reference: 'fixture',
    mode: CallMode.video,
    planName: 'Consultation',
    durationMinutes: 15,
    amount: 999,
    status: status,
    at: DateTime(2026, 11, 17),
  );
  test('unpaid and searching bookings never claim an active consultation', () {
    expect(booking('pending_payment').statusLabel, 'Payment pending');
    expect(booking('searching').statusLabel, 'Finding lawyer');
    expect(booking('scheduled').statusLabel, 'Scheduled');
    expect(booking('active').statusLabel, 'In progress');
    expect(booking('cancelled').statusLabel, 'Cancelled');
  });
}
