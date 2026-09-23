/// The choices a lawyer picks from, shared by registration and the profile
/// screen so a saved value always matches an option.
///
/// These will come from the backend once admins manage categories.
abstract final class LawyerOptions {
  static const experienceBands = [
    '0-2 years',
    '3-5 years',
    '6-10 years',
    '10+ years',
  ];

  static const languages = [
    'Hindi',
    'English',
    'Punjabi',
    'Marathi',
    'Bengali',
    'Tamil',
    'Telugu',
    'Gujarati',
    'Kannada',
    'Malayalam',
  ];

  static const specialisations = [
    'Criminal',
    'Family',
    'Corporate',
    'Tax',
    'Property',
    'Cyber',
    'Consumer',
    'Intellectual Property',
  ];

  static const caseCategories = [
    'Bail',
    'FIR',
    'Divorce',
    'Custody',
    'Maintenance',
    'Property dispute',
    'Consumer complaint',
    'Cheque bounce',
  ];

  static const banks = [
    'State Bank of India',
    'HDFC Bank',
    'ICICI Bank',
    'Axis Bank',
    'Punjab National Bank',
    'Bank of Baroda',
    'Kotak Mahindra Bank',
    'Canara Bank',
    'Union Bank of India',
    'IndusInd Bank',
  ];

  static const consultationTypes = [
    'Audio Consultation',
    'Video Consultation',
    'Chat Consultation',
  ];
}
