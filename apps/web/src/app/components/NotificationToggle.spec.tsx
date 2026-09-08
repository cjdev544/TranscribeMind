import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationToggle } from "./NotificationToggle.js";

describe("NotificationToggle (unsupported environment)", () => {
  it("renders nothing when the Notification API is unavailable", () => {
    const { container } = render(<NotificationToggle />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("NotificationToggle (supported environment)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests permission on click when permission is still default", async () => {
    const requestPermission = vi.fn().mockResolvedValue("granted");
    vi.stubGlobal("Notification", { permission: "default", requestPermission });
    render(<NotificationToggle />);
    const actor = userEvent.setup();

    await actor.click(screen.getByRole("button"));

    expect(requestPermission).toHaveBeenCalled();
    expect(await screen.findByTitle("Te avisaremos cuando un video termine de procesarse")).toBeInTheDocument();
  });

  it("is disabled and shows a blocked hint when permission was denied", () => {
    vi.stubGlobal("Notification", { permission: "denied", requestPermission: vi.fn() });
    render(<NotificationToggle />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute(
      "title",
      "Notificaciones bloqueadas — actívalas desde la configuración del navegador"
    );
  });

  it("does not re-request permission once already granted", async () => {
    const requestPermission = vi.fn().mockResolvedValue("granted");
    vi.stubGlobal("Notification", { permission: "granted", requestPermission });
    render(<NotificationToggle />);
    const actor = userEvent.setup();

    expect(screen.getByRole("button")).toBeDisabled();
    await actor.click(screen.getByRole("button"));

    expect(requestPermission).not.toHaveBeenCalled();
  });
});
