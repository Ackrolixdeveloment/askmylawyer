/**
 * The chime that plays when a notification arrives while the panel is open.
 *
 * Browsers refuse to play audio before the page has been interacted with, so
 * a rejected play() is ignored: the badge and the banner still tell the
 * story. One shared element, rewound each time, so rapid alerts do not stack
 * up copies.
 */
let bell: HTMLAudioElement | null = null;

export function playNotificationSound() {
  if (typeof window === "undefined") return;

  try {
    bell ??= new Audio("/notification.wav");
    bell.currentTime = 0;
    void bell.play().catch(() => {
      // Not interacted with yet, or the tab is muted.
    });
  } catch {
    // No audio support — nothing worth reporting.
  }
}
