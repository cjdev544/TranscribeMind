import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorState } from "./ErrorState.js";

describe("ErrorState", () => {
  it("shows the provided error message", () => {
    render(<ErrorState message="Whisper API timed out" onRetry={vi.fn()} isRetrying={false} />);
    expect(screen.getByText("Whisper API timed out")).toBeInTheDocument();
  });

  it("falls back to a generic message when there is none", () => {
    render(<ErrorState message={null} onRetry={vi.fn()} isRetrying={false} />);
    expect(screen.getByText("Ocurrió un error inesperado.")).toBeInTheDocument();
  });

  it("calls onRetry when the retry button is clicked", async () => {
    const onRetry = vi.fn();
    render(<ErrorState message="boom" onRetry={onRetry} isRetrying={false} />);
    const actor = userEvent.setup();

    await actor.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(onRetry).toHaveBeenCalled();
  });

  it("disables the button and shows a retrying label while retrying", () => {
    render(<ErrorState message="boom" onRetry={vi.fn()} isRetrying={true} />);
    expect(screen.getByRole("button", { name: "Reintentando..." })).toBeDisabled();
  });
});
