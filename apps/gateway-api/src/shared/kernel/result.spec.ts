import { describe, expect, it } from "vitest";
import { err, ok } from "./result.js";

describe("ok", () => {
  it("wraps a value into a successful Result", () => {
    const result = ok(42);

    expect(result).toEqual({ ok: true, value: 42 });
  });
});

describe("err", () => {
  it("wraps an error into a failed Result", () => {
    const result = err("boom");

    expect(result).toEqual({ ok: false, error: "boom" });
  });
});
