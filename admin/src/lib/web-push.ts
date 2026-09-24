import { initializeApp, getApps } from "firebase/app";
import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type Messaging,
} from "firebase/messaging";
import { api } from "./api";
import { FIREBASE_CONFIG, FIREBASE_VAPID_KEY } from "./firebase-config";

/** The token this browser was issued, kept so sign-out can hand it back. */
let current: string | null = null;

async function messagingIfSupported(): Promise<Messaging | null> {
  // Push needs a secure origin and a service worker: neither holds in every
  // browser, and none of it exists on the server.
  if (typeof window === "undefined") return null;
  if (!(await isSupported())) return null;

  const app = getApps()[0] ?? initializeApp(FIREBASE_CONFIG);
  return getMessaging(app);
}

/**
 * Asks for notification permission, registers this browser with the backend
 * and keeps the token fresh.
 *
 * Desktop notifications are for when the panel is closed or in another tab —
 * while it is open the live stream already does the job, so a message that
 * arrives in the foreground is ignored here.
 */
export async function enableWebPush() {
  const messaging = await messagingIfSupported();
  if (!messaging) return;

  // "denied" is the browser remembering a previous no; asking again is not
  // allowed and would throw.
  if (Notification.permission === "denied") return;
  if (Notification.permission === "default") {
    const outcome = await Notification.requestPermission();
    if (outcome !== "granted") return;
  }

  try {
    const registration = await activeWorker();

    const token = await getToken(messaging, {
      vapidKey: FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    if (!token || token === current) return;

    await api("/admin/alerts/browser", { method: "POST", body: { token } });
    current = token;

    // The panel handles foreground alerts itself; this only stops the SDK
    // from complaining that nobody is listening.
    onMessage(messaging, () => {});
  } catch (error) {
    console.warn("[push] browser not registered", error);
  }
}

/**
 * Registers the worker and waits until it is actually running.
 *
 * `register()` resolves as soon as the worker is installing, and asking for
 * a token before it is active fails with "no active Service Worker".
 */
async function activeWorker() {
  const registration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js",
  );
  if (registration.active) return registration;

  const worker = registration.installing ?? registration.waiting;
  if (!worker) {
    // Registered by an earlier visit: `ready` resolves once it takes over.
    await navigator.serviceWorker.ready;
    return registration;
  }

  await new Promise<void>((resolve) => {
    worker.addEventListener("statechange", () => {
      if (worker.state === "activated") resolve();
    });
  });

  return registration;
}

/** Called on sign-out, so this browser stops receiving that admin's alerts. */
export async function disableWebPush() {
  if (!current) return;

  const token = current;
  current = null;

  try {
    await api("/admin/alerts/browser", { method: "DELETE", body: { token } });
    const messaging = await messagingIfSupported();
    if (messaging) await deleteToken(messaging);
  } catch {
    // Signing out locally matters more; the token is replaced on next login.
  }
}
