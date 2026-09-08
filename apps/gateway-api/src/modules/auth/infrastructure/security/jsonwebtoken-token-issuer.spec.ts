import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import { JsonWebTokenIssuer } from "./jsonwebtoken-token-issuer.js";

const user = { id: "u1", email: "a@b.com", username: "auser", avatarUrl: null };

describe("JsonWebTokenIssuer", () => {
  it("issues a token that verifies back to the same user shape", () => {
    const issuer = new JsonWebTokenIssuer("a-very-secret-key-123456", "1h");

    const token = issuer.issue(user);

    expect(issuer.verify(token)).toEqual(user);
  });

  it("throws UnauthorizedError for a garbage token", () => {
    const issuer = new JsonWebTokenIssuer("a-very-secret-key-123456", "1h");

    expect(() => issuer.verify("not-a-real-token")).toThrow("Invalid or expired token");
  });

  it("throws UnauthorizedError for a token signed with a different secret", () => {
    const issuer = new JsonWebTokenIssuer("secret-a-123456789", "1h");
    const foreignToken = jwt.sign(user, "secret-b-123456789");

    expect(() => issuer.verify(foreignToken)).toThrow("Invalid or expired token");
  });

  it("throws UnauthorizedError for an expired token", () => {
    const issuer = new JsonWebTokenIssuer("a-very-secret-key-123456", "1h");
    const expiredToken = jwt.sign(user, "a-very-secret-key-123456", { expiresIn: -10 });

    expect(() => issuer.verify(expiredToken)).toThrow("Invalid or expired token");
  });
});
