import 'package:flutter/material.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';

/// Why we could not fill the address in, when we could not.
enum LocationProblem {
  /// Location is switched off for the whole phone.
  servicesOff,

  /// Refused this time.
  denied,

  /// Refused for good; only the system settings can undo it.
  deniedForever,

  /// Allowed, but no fix or no address came back.
  unavailable,
}

/// A place, as the profile form holds it.
class ResolvedPlace {
  const ResolvedPlace({this.city, this.state, this.pincode});

  final String? city;
  final String? state;
  final String? pincode;

  /// "Gurugram, Haryana", the shape the picker field expects.
  String? get stateCity {
    final parts = [city, state].whereType<String>().where((p) => p.isNotEmpty);
    return parts.isEmpty ? null : parts.join(', ');
  }

  bool get isEmpty => city == null && state == null && pincode == null;
}

/// The result of asking the phone where it is: one or the other, never both.
class LocationResult {
  const LocationResult.found(this.place) : problem = null;
  const LocationResult.failed(this.problem) : place = null;

  final ResolvedPlace? place;
  final LocationProblem? problem;
}

/// Turns the phone's position into a city, state and pincode.
///
/// The reverse lookup is the operating system's own — Android's Geocoder and
/// iOS's CLGeocoder — so there is no API key to manage and no address of a
/// customer leaving the device to a third party.
class LocationLookup {
  const LocationLookup();

  Future<LocationResult> resolve() async {
    if (!await Geolocator.isLocationServiceEnabled()) {
      return const LocationResult.failed(LocationProblem.servicesOff);
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.deniedForever) {
      return const LocationResult.failed(LocationProblem.deniedForever);
    }
    if (permission == LocationPermission.denied) {
      return const LocationResult.failed(LocationProblem.denied);
    }

    final position = await _position();
    if (position == null) {
      return const LocationResult.failed(LocationProblem.unavailable);
    }

    try {
      final places = await Geocoding().placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );
      if (places.isEmpty) {
        return const LocationResult.failed(LocationProblem.unavailable);
      }

      final place = _read(places.first);
      return place.isEmpty
          ? const LocationResult.failed(LocationProblem.unavailable)
          : LocationResult.found(place);
    } catch (_) {
      // The geocoder needs a network round trip on both platforms.
      return const LocationResult.failed(LocationProblem.unavailable);
    }
  }

  /// Opens the system settings, for a permission refused for good.
  Future<void> openSettings() => Geolocator.openAppSettings();

  Future<Position?> _position() async {
    try {
      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          // A city and pincode do not need a precise fix, and asking for one
          // indoors is how you end up waiting thirty seconds for nothing.
          accuracy: LocationAccuracy.medium,
          timeLimit: Duration(seconds: 15),
        ),
      );
    } catch (_) {
      return Geolocator.getLastKnownPosition();
    }
  }
}

/// Picks the city, state and pincode out of a placemark.
///
/// The fields are filled inconsistently across devices and regions — an
/// Indian address often puts the city in `locality`, but sometimes only in
/// `subAdministrativeArea` — so each one falls back through the plausible
/// alternatives rather than trusting a single field.
ResolvedPlace _read(Placemark mark) {
  String? pick(List<String?> options) {
    for (final option in options) {
      final value = option?.trim();
      if (value != null && value.isNotEmpty) return value;
    }
    return null;
  }

  return ResolvedPlace(
    city: pick([mark.locality, mark.subAdministrativeArea, mark.subLocality]),
    state: pick([mark.administrativeArea]),
    pincode: pick([mark.postalCode]),
  );
}

/// What to tell the customer when it did not work.
String locationMessage(LocationProblem problem) => switch (problem) {
  LocationProblem.servicesOff =>
    'Location is switched off on this phone. Turn it on, or type your '
        'pincode instead.',
  LocationProblem.denied =>
    'Location permission was not granted. You can type your pincode instead.',
  LocationProblem.deniedForever =>
    'Location is blocked for this app. Allow it in Settings, or type your '
        'pincode instead.',
  LocationProblem.unavailable =>
    'We could not work out your address. Please type your pincode instead.',
};

/// Says why the lookup failed, with a way out when there is one.
void showLocationProblem(BuildContext context, LocationProblem problem) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(locationMessage(problem)),
      duration: const Duration(seconds: 5),
      // Only the system settings can undo a permanent refusal, so take
      // them there rather than leaving them to find it.
      action: problem == LocationProblem.deniedForever
          ? SnackBarAction(
              label: 'Settings',
              onPressed: () => const LocationLookup().openSettings(),
            )
          : null,
    ),
  );
}
