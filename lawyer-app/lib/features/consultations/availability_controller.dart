import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';

import '../../core/network/api_client.dart';
import 'consultation_repository.dart';

/// Why the lawyer could not go online.
enum LocationProblem {
  /// The phone's location services are switched off entirely.
  servicesOff,

  /// They said no to the app this time.
  denied,

  /// They said no permanently; only Settings can undo it.
  deniedForever,
}

/// Whether the lawyer is taking consultations, and the location that allows it.
///
/// Going online needs a position: without one the engine cannot tell who is
/// nearest, so the toggle refuses to move and asks for permission again every
/// time it is tried.
class AvailabilityController extends ChangeNotifier {
  AvailabilityController._();

  static final instance = AvailabilityController._();

  final _consultations = ConsultationRepository.instance;

  bool _isOnline = false;
  bool _busy = false;
  LocationProblem? _problem;
  String? _error;

  Timer? _heartbeat;
  int _heartbeatSeconds = 45;

  bool get isOnline => _isOnline;

  /// True while a toggle is being carried out.
  bool get busy => _busy;

  /// Set when going online failed for want of a location.
  LocationProblem? get problem => _problem;
  String? get error => _error;

  /// Picks up whatever the backend already thinks, when the app opens.
  Future<void> load() async {
    try {
      _isOnline = await _consultations.isOnline();
      if (_isOnline) _startHeartbeat();
      notifyListeners();
    } on ApiException {
      // Not signed in yet, or offline; the dashboard shows the toggle off.
    }
  }

  /// The toggle. Going online asks for location first, every time.
  Future<void> setOnline(bool value) async {
    if (_busy) return;

    _busy = true;
    _problem = null;
    _error = null;
    notifyListeners();

    try {
      if (!value) {
        _stopHeartbeat();
        await _consultations.goOffline();
        _isOnline = false;
        return;
      }

      final position = await _position();
      if (position == null) {
        _isOnline = false;
        return;
      }

      _heartbeatSeconds = await _consultations.heartbeat(
        isOnline: true,
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
      );
      _isOnline = true;
      _startHeartbeat();
    } on ApiException catch (error) {
      _error = error.message;
      _isOnline = false;
    } finally {
      _busy = false;
      notifyListeners();
    }
  }

  /// Asks the phone where it is, requesting permission if it has to.
  Future<Position?> _position() async {
    if (!await Geolocator.isLocationServiceEnabled()) {
      _problem = LocationProblem.servicesOff;
      return null;
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.deniedForever) {
      _problem = LocationProblem.deniedForever;
      return null;
    }
    if (permission == LocationPermission.denied) {
      _problem = LocationProblem.denied;
      return null;
    }

    try {
      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.medium,
          timeLimit: Duration(seconds: 15),
        ),
      );
    } catch (_) {
      // A fix can take a while indoors; the last known position will do.
      return Geolocator.getLastKnownPosition();
    }
  }

  /// Opens the system settings, for a permission that was refused for good.
  Future<void> openSettings() => Geolocator.openAppSettings();

  void _startHeartbeat() {
    _heartbeat?.cancel();
    _heartbeat = Timer.periodic(
      Duration(seconds: _heartbeatSeconds),
      (_) => _beat(),
    );
  }

  void _stopHeartbeat() {
    _heartbeat?.cancel();
    _heartbeat = null;
  }

  /// A quiet check-in: position refreshed, still available.
  Future<void> _beat() async {
    if (!_isOnline) return;

    try {
      final position = await Geolocator.getLastKnownPosition();
      _heartbeatSeconds = await _consultations.heartbeat(
        isOnline: true,
        latitude: position?.latitude,
        longitude: position?.longitude,
        accuracy: position?.accuracy,
      );
    } on ApiException {
      // A missed beat is fine; the next one carries the position.
    }
  }

  @override
  void dispose() {
    _stopHeartbeat();
    super.dispose();
  }
}
