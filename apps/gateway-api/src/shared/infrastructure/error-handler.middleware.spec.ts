import { describe, expect, it, vi } from "vitest";
import type { Response } from "express";
import { createErrorHandler } from "./error-handler.middleware.js";
import { ConflictError, DomainError } from "../kernel/domain-error.js";

function mockResponse(): Response {
  const res = { status: vi.fn(), json: vi.fn() } as unknown as Response;
  vi.mocked(res.status).mockReturnValue(res);
  return res;
}

describe("createErrorHandler", () => {
  it("maps a DomainError to its own http status and code", () => {
    const logger = { error: vi.fn() };
    const errorHandler = createErrorHandler(logger as never);
    const res = mockResponse();

    errorHandler(new ConflictError("Email is already registered"), {} as never, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: "CONFLICT", message: "Email is already registered" });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("logs and maps an unknown error to a generic 500", () => {
    const logger = { error: vi.fn() };
    const errorHandler = createErrorHandler(logger as never);
    const res = mockResponse();
    const error = new Error("unexpected");

    errorHandler(error, {} as never, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "INTERNAL_ERROR", message: "Something went wrong" });
    expect(logger.error).toHaveBeenCalledWith({ err: error }, "Unhandled error in gateway-api");
  });

  it("uses the DomainError base status of 400 when not subclassed", () => {
    const errorHandler = createErrorHandler({ error: vi.fn() } as never);
    const res = mockResponse();

    errorHandler(new DomainError("bad input", "VALIDATION_ERROR"), {} as never, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
