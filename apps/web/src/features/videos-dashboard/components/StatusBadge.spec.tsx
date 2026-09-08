import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "./StatusBadge.js";
import { VideoStatusValues } from "../../../shared/types/video.js";

describe("StatusBadge", () => {
  it("renders the Spanish label for each status", () => {
    render(<StatusBadge status={VideoStatusValues.QUEUED} />);
    expect(screen.getByText("En cola")).toBeInTheDocument();
  });

  it("shows a destructive-styled badge for a failed video", () => {
    render(<StatusBadge status={VideoStatusValues.FAILED} />);
    expect(screen.getByText("Fallido")).toHaveClass("text-destructive");
  });

  it("shows a success-styled badge for a completed video", () => {
    render(<StatusBadge status={VideoStatusValues.COMPLETED} />);
    expect(screen.getByText("Completado")).toHaveClass("text-success");
  });

  it("spins the icon while a video is still processing", () => {
    const { container } = render(<StatusBadge status={VideoStatusValues.TRANSCRIBING} />);
    expect(container.querySelector("svg")).toHaveClass("animate-spin");
  });

  it("does not spin the icon once a video is completed", () => {
    const { container } = render(<StatusBadge status={VideoStatusValues.COMPLETED} />);
    expect(container.querySelector("svg")).not.toHaveClass("animate-spin");
  });
});
