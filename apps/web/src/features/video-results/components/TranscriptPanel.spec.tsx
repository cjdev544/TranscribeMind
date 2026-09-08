import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TranscriptPanel } from "./TranscriptPanel.js";

describe("TranscriptPanel", () => {
  it("shows the plain transcript text when there are no segments", () => {
    render(<TranscriptPanel transcript="Hello world, this is the transcript." segments={null} />);
    expect(screen.getByText("Hello world, this is the transcript.")).toBeInTheDocument();
  });

  it("shows a list of timestamped segments when available", () => {
    const segments = [
      { start: 0, end: 5, text: "First segment." },
      { start: 65, end: 70, text: "Second segment." },
    ];
    render(<TranscriptPanel transcript="fallback" segments={segments} />);

    expect(screen.getByText("First segment.")).toBeInTheDocument();
    expect(screen.getByText("Second segment.")).toBeInTheDocument();
    expect(screen.getByText("0:00")).toBeInTheDocument();
    expect(screen.getByText("1:05")).toBeInTheDocument();
  });

  it("seeks the player when a segment timestamp is clicked", async () => {
    const onSeek = vi.fn();
    const segments = [{ start: 42, end: 45, text: "Some line." }];
    render(<TranscriptPanel transcript="fallback" segments={segments} onSeek={onSeek} />);
    const actor = userEvent.setup();

    await actor.click(screen.getByText("0:42"));

    expect(onSeek).toHaveBeenCalledWith(42);
  });

  it("disables segment buttons when there is no onSeek handler", () => {
    const segments = [{ start: 42, end: 45, text: "Some line." }];
    render(<TranscriptPanel transcript="fallback" segments={segments} />);

    expect(screen.getByRole("button", { name: "0:42" })).toBeDisabled();
  });

  it("falls back to the raw transcript when segments is an empty array", () => {
    render(<TranscriptPanel transcript="Just the raw text." segments={[]} />);
    expect(screen.getByText("Just the raw text.")).toBeInTheDocument();
  });
});
