import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { createJwtAuthMiddleware } from "./jwt-auth.middleware.js";
import { mockTokenIssuer } from "../../../../test/mockAuthPorts.js";

describe("createJwtAuthMiddleware", () => {
  it("throws UnauthorizedError when there is no token cookie", () => {
    const middleware = createJwtAuthMiddleware(mockTokenIssuer());
    const req = { cookies: {} } as Request;
    const next = vi.fn();

    expect(() => middleware(req, {} as Response, next)).toThrow("Authentication required");
    expect(next).not.toHaveBeenCalled();
  });

  it("attaches userId to the request and calls next on a valid token", () => {
    const tokenIssuer = mockTokenIssuer({ verify: vi.fn().mockReturnValue({ id: "u1", email: "a@b.com", username: "a", avatarUrl: null }) });
    const middleware = createJwtAuthMiddleware(tokenIssuer);
    const req = { cookies: { token: "good-token" } } as unknown as Request;
    const next = vi.fn();

    middleware(req, {} as Response, next);

    expect(req.userId).toBe("u1");
    expect(next).toHaveBeenCalled();
  });

  it("propagates the error thrown by an invalid token", () => {
    const tokenIssuer = mockTokenIssuer({
      verify: vi.fn().mockImplementation(() => {
        throw new Error("Invalid or expired token");
      }),
    });
    const middleware = createJwtAuthMiddleware(tokenIssuer);
    const req = { cookies: { token: "bad-token" } } as unknown as Request;

    expect(() => middleware(req, {} as Response, vi.fn())).toThrow("Invalid or expired token");
  });
});
