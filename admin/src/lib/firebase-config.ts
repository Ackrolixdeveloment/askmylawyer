/**
 * The panel's Firebase web app. These values ship to the browser by design —
 * they identify the project, they are not secrets. The private half is the
 * service account on the backend.
 */
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAaqpHMyq9NFcepPMU6GPEHmayPTFbYPk4",
  authDomain: "askmylawyer-3d8e6.firebaseapp.com",
  projectId: "askmylawyer-3d8e6",
  storageBucket: "askmylawyer-3d8e6.firebasestorage.app",
  messagingSenderId: "11580874309",
  appId: "1:11580874309:web:c2eaa0fdfdef93c5938d2c",
};

/**
 * Web Push certificate from Firebase → Cloud Messaging → Web configuration.
 * Without it the browser cannot be issued a token.
 */
export const FIREBASE_VAPID_KEY =
  "BHrDsGKlX4ce6WpzTUnEbHZ8MQ_IgwBoFbJZaElZW86Ty0Zz_Hd6lO3JCQhjOKzt80LcsgkKPZCOnaA9u7ozFY8";
