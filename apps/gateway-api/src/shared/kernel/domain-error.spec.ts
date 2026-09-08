import { describe, expect, it } from "vitest";
import { ConflictError, DomainError, NotFoundError, UnauthorizedError } from "./domain-error.js";

describe("DomainError", () => {
  it("defaults to a 400 http status", () => {
    const error = new DomainError("boom", "SOME_CODE");

    expect(error.httpStatus).toBe(400);
    expect(error.code).toBe("SOME_CODE");
    expect(error.name).toBe("DomainError");
  });

  it("accepts a custom http status", () => {
    const error = new DomainError("boom", "SOME_CODE", 422);

    expect(error.httpStatus).toBe(422);
  });
});

describe("NotFoundError", () => {
  it("sets code NOT_FOUND and status 404", () => {
    const error = new NotFoundError("Video not found");

    expect(error.code).toBe("NOT_FOUND");
    expect(error.httpStatus).toBe(404);
    expect(error).toBeInstanceOf(DomainError);
  });
});

describe("UnauthorizedError", () => {
  it("sets code UNAUTHORIZED and status 401", () => {
    const error = new UnauthorizedError("Invalid credentials");

    expect(error.code).toBe("UNAUTHORIZED");
    expect(error.httpStatus).toBe(401);
  });
});

describe("ConflictError", () => {
  it("sets code CONFLICT and status 409", () => {
    const error = new ConflictError("Email already registered");

    expect(error.code).toBe("CONFLICT");
    expect(error.httpStatus).toBe(409);
  });
});
