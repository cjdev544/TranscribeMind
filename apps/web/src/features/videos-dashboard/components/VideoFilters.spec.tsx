import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VideoFilters } from "./VideoFilters.js";
import { VideoStatusValues } from "../../../shared/types/video.js";

describe("VideoFilters", () => {
  it("calls onSearchChange as the user types", async () => {
    const onSearchChange = vi.fn();
    render(<VideoFilters search="" onSearchChange={onSearchChange} status={undefined} onStatusChange={vi.fn()} />);
    const actor = userEvent.setup();

    await actor.type(screen.getByPlaceholderText("Buscar por nombre..."), "cat");

    expect(onSearchChange).toHaveBeenCalledTimes(3);
    expect(onSearchChange).toHaveBeenLastCalledWith("t");
  });

  it("calls onStatusChange with the matching status when a filter button is clicked", async () => {
    const onStatusChange = vi.fn();
    render(<VideoFilters search="" onSearchChange={vi.fn()} status={undefined} onStatusChange={onStatusChange} />);
    const actor = userEvent.setup();

    await actor.click(screen.getByRole("button", { name: "Completados" }));

    expect(onStatusChange).toHaveBeenCalledWith(VideoStatusValues.COMPLETED);
  });

  it("calls onStatusChange with undefined when 'Todos' is clicked", async () => {
    const onStatusChange = vi.fn();
    render(
      <VideoFilters
        search=""
        onSearchChange={vi.fn()}
        status={VideoStatusValues.FAILED}
        onStatusChange={onStatusChange}
      />
    );
    const actor = userEvent.setup();

    await actor.click(screen.getByRole("button", { name: "Todos" }));

    expect(onStatusChange).toHaveBeenCalledWith(undefined);
  });

  it("highlights the currently active status filter", () => {
    render(
      <VideoFilters
        search=""
        onSearchChange={vi.fn()}
        status={VideoStatusValues.FAILED}
        onStatusChange={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Fallidos" })).toHaveClass("border-border");
    expect(screen.getByRole("button", { name: "Todos" })).not.toHaveClass("border-border");
  });
});
