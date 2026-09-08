import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Brand } from "./brand.js";

describe("Brand", () => {
  it("renders the product name at default size", () => {
    render(<Brand />);
    expect(screen.getByText("TranscribeMind")).toHaveClass("text-xl");
  });

  it("renders smaller text when size is 'sm'", () => {
    render(<Brand size="sm" />);
    expect(screen.getByText("TranscribeMind")).toHaveClass("text-sm");
  });
});
