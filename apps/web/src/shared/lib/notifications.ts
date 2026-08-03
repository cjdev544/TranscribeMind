/**
 * Plain Notification API only — no service worker `push` handler, no VAPID
 * keys, no server-side subscription storage. That means it only fires while
 * this tab/PWA is loaded (background tab is fine, fully closed browser is
 * not), and it won't work on Android Chrome (which requires notifications
 * to go through ServiceWorkerRegistration.showNotification()). Good enough
 * for "let me know when it's done without me babysitting the tab."
 */
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission | null {
  return isNotificationSupported() ? Notification.permission : null;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return "denied";
  return Notification.requestPermission();
}

export function notifyVideoStatus(title: string, body: string, onClick?: () => void): void {
  if (!isNotificationSupported() || Notification.permission !== "granted") return;

  const notification = new Notification(title, { body, icon: "/favicon.svg" });
  notification.onclick = () => {
    window.focus();
    onClick?.();
    notification.close();
  };
}
