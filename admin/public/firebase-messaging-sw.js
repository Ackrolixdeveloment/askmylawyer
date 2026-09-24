/*
 * Handles notifications that arrive while the panel is closed or in another
 * tab. Service workers cannot use ES modules from node_modules, so the
 * compat build is loaded from Google's CDN, and the config is inline — these
 * values are public by design.
 */
importScripts("https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAaqpHMyq9NFcepPMU6GPEHmayPTFbYPk4",
  authDomain: "askmylawyer-3d8e6.firebaseapp.com",
  projectId: "askmylawyer-3d8e6",
  storageBucket: "askmylawyer-3d8e6.firebasestorage.app",
  messagingSenderId: "11580874309",
  appId: "1:11580874309:web:c2eaa0fdfdef93c5938d2c",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification ?? {};

  self.registration.showNotification(notification.title ?? "Ask My Lawyer", {
    body: notification.body ?? "",
    icon: "/logo.png",
    badge: "/logo.png",
    // Where clicking it should go, passed through from the backend.
    data: { link: payload.data?.link ?? "/notifications/alerts" },
    tag: "aml-admin-alert",
  });
});

/** Clicking the notification focuses an open panel, or opens a new one. */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link ?? "/notifications/alerts";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windows) => {
        for (const client of windows) {
          if (client.url.includes(self.location.origin)) {
            client.focus();
            return client.navigate(link);
          }
        }
        return self.clients.openWindow(link);
      }),
  );
});
