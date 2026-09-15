/// Field validators. Each returns an error message, or null when valid.
///
/// Formats follow the platform spec: PAN as AAAAA9999A, Aadhaar as 12 digits,
/// and Indian mobile numbers starting 6-9.
abstract final class Validators {
  static String? name(String value) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) return 'Enter your full name';
    if (trimmed.length < 3) return 'Name looks too short';
    if (!RegExp(r"^[a-zA-Z][a-zA-Z .'-]*$").hasMatch(trimmed)) {
      return 'Use letters only';
    }
    return null;
  }

  static String? email(String value) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) return 'Enter your email address';
    if (!RegExp(r'^[\w.+-]+@[\w-]+\.[\w.-]+$').hasMatch(trimmed)) {
      return 'Enter a valid email address';
    }
    return null;
  }

  static String? mobile(String value) {
    final digits = value.trim();
    if (digits.isEmpty) return 'Enter your mobile number';
    if (!RegExp(r'^[6-9]\d{9}$').hasMatch(digits)) {
      return 'Enter a valid 10-digit mobile number';
    }
    return null;
  }

  static String? aadhaar(String value) {
    final digits = value.replaceAll(' ', '');
    if (digits.isEmpty) return 'Enter your Aadhaar number';
    if (!RegExp(r'^\d{12}$').hasMatch(digits)) {
      return 'Aadhaar must be 12 digits';
    }
    return null;
  }

  static String? pan(String value) {
    final trimmed = value.trim().toUpperCase();
    if (trimmed.isEmpty) return 'Enter your PAN number';
    if (!RegExp(r'^[A-Z]{5}\d{4}[A-Z]$').hasMatch(trimmed)) {
      return 'PAN must look like ABCDE1234F';
    }
    return null;
  }

  static String? enrollment(String value) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) return 'Enter your enrollment number';
    if (trimmed.length < 4) return 'Enrollment number looks too short';
    return null;
  }

  static String? accountNumber(String value) {
    final digits = value.trim();
    if (digits.isEmpty) return 'Enter your account number';
    if (!RegExp(r'^\d{9,18}$').hasMatch(digits)) {
      return 'Account number must be 9 to 18 digits';
    }
    return null;
  }

  static String? ifsc(String value) {
    final trimmed = value.trim().toUpperCase();
    if (trimmed.isEmpty) return 'Enter the IFSC code';
    if (!RegExp(r'^[A-Z]{4}0[A-Z0-9]{6}$').hasMatch(trimmed)) {
      return 'IFSC must look like HDFC0001234';
    }
    return null;
  }

  static String? required(String value, String label) {
    if (value.trim().isEmpty) return 'Enter $label';
    return null;
  }
}
