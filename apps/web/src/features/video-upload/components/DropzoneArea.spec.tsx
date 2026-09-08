import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DropzoneArea } from "./DropzoneArea.js";

describe("DropzoneArea", () => {
  it("shows the drop prompt", () => {
    render(<DropzoneArea onDrop={vi.fn()} />);
    expect(screen.getByText("Arrastra tu video aquí")).toBeInTheDocument();
  });

  it("calls onDrop with the selected file", async () => {
    const onDrop = vi.fn();
    const { container } = render(<DropzoneArea onDrop={onDrop} />);
    const actor = userEvent.setup();
    const file = new File(["x"], "clip.mp4", { type: "video/mp4" });
    const input = container.querySelector("input[type='file']") as HTMLInputElement;

    await actor.upload(input, file);

    expect(onDrop).toHaveBeenCalledWith(file);
  });
});
