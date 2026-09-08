import { describe, expect, it } from "vitest";
import { DomainError } from "../../../shared/kernel/domain-error.js";
import { normalizeTitle } from "./video-title.js";

describe("normalizeTitle", () => {
  it("returns null when title is undefined", () => {
    expect(normalizeTitle(undefined)).toBeNull();
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeTitle("  Mi video  ")).toBe("Mi video");
  });

  it("collapses a blank string to null", () => {
    expect(normalizeTitle("   ")).toBeNull();
  });

  it("accepts a title exactly at the max length", () => {
    const title = "a".repeat(200);

    expect(normalizeTitle(title)).toBe(title);
  });

  it("throws a DomainError when the title exceeds the max length", () => {
    const title = "a".repeat(201);

    expect(() => normalizeTitle(title)).toThrow(DomainError);
  });
});
