import { afterEach, describe, expect, it, vi } from "vitest";
import { getNotificationPermission, isNotificationSupported, notifyVideoStatus, requestNotificationPermission } from "./notifications.js";

describe("notifications (unsupported environment)", () => {
  it("reports unsupported and every action degrades gracefully", async () => {
    expect(isNotificationSupported()).toBe(false);
    expect(getNotificationPermission()).toBeNull();
    expect(await requestNotificationPermission()).toBe("denied");
    expect(() => notifyVideoStatus("t", "b")).not.toThrow();
  });
});

describe("notifications (supported environment)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads the current permission from the Notification API", () => {
    vi.stubGlobal("Notification", { permission: "granted", requestPermission: vi.fn() });

    expect(isNotificationSupported()).toBe(true);
    expect(getNotificationPermission()).toBe("granted");
  });

  it("requests permission via the Notification API", async () => {
    vi.stubGlobal("Notification", { permission: "default", requestPermission: vi.fn().mockResolvedValue("granted") });

    expect(await requestNotificationPermission()).toBe("granted");
  });

  it("does not create a notification when permission is not granted", () => {
    const NotificationMock = vi.fn();
    vi.stubGlobal("Notification", Object.assign(NotificationMock, { permission: "denied" }));

    notifyVideoStatus("Listo", "Tu video esta listo");

    expect(NotificationMock).not.toHaveBeenCalled();
  });

  it("creates a notification and focuses the window on click", () => {
    const close = vi.fn();
    const instances: { onclick: (() => void) | null }[] = [];
    const NotificationMock = vi.fn().mockImplementation(function (this: { onclick: (() => void) | null; close: typeof close }) {
      this.onclick = null;
      this.close = close;
      instances.push(this);
    });
    vi.stubGlobal("Notification", Object.assign(NotificationMock, { permission: "granted" }));
    const focus = vi.fn();
    vi.stubGlobal("window", { ...window, focus });
    const onClick = vi.fn();

    notifyVideoStatus("Listo", "Tu video esta listo", onClick);

    expect(NotificationMock).toHaveBeenCalledWith("Listo", expect.objectContaining({ body: "Tu video esta listo" }));
    instances[0]!.onclick!();
    expect(focus).toHaveBeenCalled();
    expect(onClick).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });
});
