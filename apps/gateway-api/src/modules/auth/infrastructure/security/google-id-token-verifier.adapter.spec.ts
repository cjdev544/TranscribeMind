import { describe, expect, it, vi } from "vitest";

const { verifyIdTokenMock } = vi.hoisted(() => ({ verifyIdTokenMock: vi.fn() }));

vi.mock("google-auth-library", () => ({
  OAuth2Client: class {
    verifyIdToken = verifyIdTokenMock;
  },
}));

const { GoogleIdTokenVerifierAdapter } = await import("./google-id-token-verifier.adapter.js");

describe("GoogleIdTokenVerifierAdapter", () => {
  it("maps a valid Google payload to a GoogleProfile", async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({ sub: "g1", email: "a@b.com", name: "A User", picture: "https://a.png" }),
    });
    const adapter = new GoogleIdTokenVerifierAdapter("client-id");

    const profile = await adapter.verify("id-token");

    expect(profile).toEqual({ googleId: "g1", email: "a@b.com", name: "A User", avatarUrl: "https://a.png" });
  });

  it("defaults name and avatarUrl to null when absent", async () => {
    verifyIdTokenMock.mockResolvedValue({ getPayload: () => ({ sub: "g1", email: "a@b.com" }) });
    const adapter = new GoogleIdTokenVerifierAdapter("client-id");

    const profile = await adapter.verify("id-token");

    expect(profile.name).toBeNull();
    expect(profile.avatarUrl).toBeNull();
  });

  it("throws UnauthorizedError when verification fails", async () => {
    verifyIdTokenMock.mockRejectedValue(new Error("invalid signature"));
    const adapter = new GoogleIdTokenVerifierAdapter("client-id");

    await expect(adapter.verify("bad-token")).rejects.toThrow("Token de Google inválido");
  });

  it("throws UnauthorizedError when the payload has no sub or email", async () => {
    verifyIdTokenMock.mockResolvedValue({ getPayload: () => ({ sub: undefined, email: undefined }) });
    const adapter = new GoogleIdTokenVerifierAdapter("client-id");

    await expect(adapter.verify("id-token")).rejects.toThrow("Token de Google inválido");
  });
});
