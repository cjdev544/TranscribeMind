import { useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "../../shared/ui/button.js";
import {
  getNotificationPermission,
  isNotificationSupported,
  requestNotificationPermission,
} from "../../shared/lib/notifications.js";

export function NotificationToggle() {
  const [permission, setPermission] = useState(getNotificationPermission());

  if (!isNotificationSupported()) return null;

  const handleClick = async () => {
    if (permission !== "default") return;
    setPermission(await requestNotificationPermission());
  };

  const title =
    permission === "granted"
      ? "Te avisaremos cuando un video termine de procesarse"
      : permission === "denied"
        ? "Notificaciones bloqueadas — actívalas desde la configuración del navegador"
        : "Avisarme cuando un video termine de procesarse";

  return (
    <Button variant="ghost" size="icon" title={title} onClick={handleClick} disabled={permission !== "default"}>
      {permission === "denied" ? (
        <BellOff className="h-4 w-4 text-muted-foreground" />
      ) : (
        <Bell className={permission === "granted" ? "h-4 w-4 text-primary" : "h-4 w-4"} />
      )}
    </Button>
  );
}
