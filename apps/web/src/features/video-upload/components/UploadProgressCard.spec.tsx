import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { UploadProgressCard } from "./UploadProgressCard.js";

describe("UploadProgressCard", () => {
  it("shows the file name and percent", () => {
    render(<UploadProgressCard fileName="clip.mp4" percent={37} />);
    expect(screen.getByText("Subiendo: clip.mp4")).toBeInTheDocument();
    expect(screen.getByText("37%")).toBeInTheDocument();
  });
});
