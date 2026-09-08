import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProcessingStepsCard } from "./ProcessingStepsCard.js";
import { VideoStatusValues } from "../../../shared/types/video.js";

describe("ProcessingStepsCard", () => {
  it("shows all step labels", () => {
    render(<ProcessingStepsCard status={VideoStatusValues.QUEUED} />);
    expect(screen.getByText("En cola")).toBeInTheDocument();
    expect(screen.getByText("Extrayendo audio")).toBeInTheDocument();
    expect(screen.getByText("Transcribiendo")).toBeInTheDocument();
    expect(screen.getByText("Analizando con IA")).toBeInTheDocument();
    expect(screen.getByText("Completado")).toBeInTheDocument();
  });

  it("appends live progress to the active, progress-capable step", () => {
    render(<ProcessingStepsCard status={VideoStatusValues.TRANSCRIBING} progress={42} />);
    expect(screen.getByText("Transcribiendo (42%)")).toBeInTheDocument();
  });

  it("shows a long-video hint alongside a progressing step", () => {
    render(<ProcessingStepsCard status={VideoStatusValues.TRANSCRIBING} progress={42} />);
    expect(screen.getByText("Los videos largos pueden tardar varios minutos en transcribirse.")).toBeInTheDocument();
  });

  it("does not show progress for a step that has no partial signal", () => {
    render(<ProcessingStepsCard status={VideoStatusValues.ANALYZING_AI} progress={42} />);
    expect(screen.getByText("Analizando con IA")).toBeInTheDocument();
    expect(screen.queryByText(/\(42%\)/)).not.toBeInTheDocument();
  });

  it("does not show progress when progress is 0", () => {
    render(<ProcessingStepsCard status={VideoStatusValues.QUEUED} progress={0} />);
    expect(screen.getByText("En cola")).toBeInTheDocument();
    expect(screen.queryByText(/\(0%\)/)).not.toBeInTheDocument();
  });

  it("marks every step done when completed", () => {
    const { container } = render(<ProcessingStepsCard status={VideoStatusValues.COMPLETED} />);
    expect(container.querySelectorAll(".border-success")).toHaveLength(5);
  });
});
