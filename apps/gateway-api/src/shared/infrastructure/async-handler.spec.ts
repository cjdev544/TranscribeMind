import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { asyncHandler } from "./async-handler.js";

describe("asyncHandler", () => {
  it("calls the wrapped handler with req, res, next", async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const wrapped = asyncHandler(handler);
    const req = {} as Request;
    const res = {} as Response;
    const next = vi.fn();

    await wrapped(req, res, next);

    expect(handler).toHaveBeenCalledWith(req, res, next);
  });

  it("forwards a rejected promise to next instead of throwing", async () => {
    const error = new Error("boom");
    const handler = vi.fn().mockRejectedValue(error);
    const wrapped = asyncHandler(handler);
    const next = vi.fn();

    wrapped({} as Request, {} as Response, next);
    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(error);
  });
});
