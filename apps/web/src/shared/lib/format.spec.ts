import { describe, expect, it } from "vitest";
import { formatDate, formatTimestamp } from "./format.js";

describe("formatDate", () => {
  it("formats a Date instance", () => {
    expect(formatDate(new Date("2026-01-15T00:00:00Z"))).toContain("2026");
  });

  it("formats an ISO string the same way as a Date", () => {
    const iso = "2026-01-15T00:00:00Z";
    expect(formatDate(iso)).toBe(formatDate(new Date(iso)));
  });
});

describe("formatTimestamp", () => {
  it("formats seconds under a minute as 0:ss", () => {
    expect(formatTimestamp(45)).toBe("0:45");
  });

  it("formats minutes and seconds, padding seconds to two digits", () => {
    expect(formatTimestamp(65)).toBe("1:05");
  });

  it("truncates fractional seconds", () => {
    expect(formatTimestamp(90.9)).toBe("1:30");
  });

  it("formats a large timestamp beyond an hour as raw minutes", () => {
    expect(formatTimestamp(3661)).toBe("61:01");
  });
});
