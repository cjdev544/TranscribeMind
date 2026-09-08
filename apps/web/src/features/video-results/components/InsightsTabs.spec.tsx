import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InsightsTabs } from "./InsightsTabs.js";
import type { SummaryAnalysis } from "../../../shared/types/video.js";

vi.mock("./ChatPanel.js", () => ({ ChatPanel: () => <div data-testid="chat-panel" /> }));

function makeAnalysis(overrides: Partial<SummaryAnalysis> = {}): SummaryAnalysis {
  return {
    executiveSummary: "This video covers cats.",
    keyPoints: ["Cats are great", "Cats sleep a lot"],
    keywords: ["cats", "pets"],
    chapters: [],
    ...overrides,
  } as SummaryAnalysis;
}

describe("InsightsTabs", () => {
  it("shows the executive summary on the default tab", () => {
    render(<InsightsTabs videoId="v1" analysis={makeAnalysis()} />);
    expect(screen.getByText("This video covers cats.")).toBeInTheDocument();
  });

  it("switches to key points when that tab is clicked", async () => {
    render(<InsightsTabs videoId="v1" analysis={makeAnalysis()} />);
    const actor = userEvent.setup();

    await actor.click(screen.getByRole("tab", { name: "Puntos clave" }));

    expect(screen.getByText("Cats are great")).toBeInTheDocument();
    expect(screen.getByText("Cats sleep a lot")).toBeInTheDocument();
  });

  it("shows keywords as badges", async () => {
    render(<InsightsTabs videoId="v1" analysis={makeAnalysis()} />);
    const actor = userEvent.setup();

    await actor.click(screen.getByRole("tab", { name: "Keywords" }));

    expect(screen.getByText("cats")).toBeInTheDocument();
    expect(screen.getByText("pets")).toBeInTheDocument();
  });

  it("does not show a chapters tab when there are no chapters", () => {
    render(<InsightsTabs videoId="v1" analysis={makeAnalysis({ chapters: [] })} />);
    expect(screen.queryByRole("tab", { name: "Capítulos" })).not.toBeInTheDocument();
  });

  it("shows chapters and seeks the player when a chapter is clicked", async () => {
    const onSeek = vi.fn();
    const analysis = makeAnalysis({
      chapters: [{ title: "Intro", startSeconds: 65 } as never],
    });
    render(<InsightsTabs videoId="v1" analysis={analysis} onSeek={onSeek} />);
    const actor = userEvent.setup();

    await actor.click(screen.getByRole("tab", { name: "Capítulos" }));
    await actor.click(screen.getByRole("button", { name: /Intro/ }));

    expect(onSeek).toHaveBeenCalledWith(65);
    expect(screen.getByText("1:05")).toBeInTheDocument();
  });

  it("disables chapter buttons when there is no onSeek handler", async () => {
    const analysis = makeAnalysis({ chapters: [{ title: "Intro", startSeconds: 65 } as never] });
    render(<InsightsTabs videoId="v1" analysis={analysis} />);
    const actor = userEvent.setup();

    await actor.click(screen.getByRole("tab", { name: "Capítulos" }));

    expect(screen.getByRole("button", { name: /Intro/ })).toBeDisabled();
  });

  it("renders the chat panel on the chat tab", async () => {
    render(<InsightsTabs videoId="v1" analysis={makeAnalysis()} />);
    const actor = userEvent.setup();

    await actor.click(screen.getByRole("tab", { name: "Preguntas" }));

    expect(screen.getByTestId("chat-panel")).toBeInTheDocument();
  });
});
