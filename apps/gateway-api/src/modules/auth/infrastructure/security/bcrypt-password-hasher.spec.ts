import { describe, expect, it } from "vitest";
import { BcryptPasswordHasher } from "./bcrypt-password-hasher.js";

describe("BcryptPasswordHasher", () => {
  it("hashes a password to a different string and verifies it back", async () => {
    const hasher = new BcryptPasswordHasher();

    const hash = await hasher.hash("my-secret-password");

    expect(hash).not.toBe("my-secret-password");
    expect(await hasher.compare("my-secret-password", hash)).toBe(true);
  });

  it("rejects an incorrect password against a hash", async () => {
    const hasher = new BcryptPasswordHasher();
    const hash = await hasher.hash("correct-password");

    expect(await hasher.compare("wrong-password", hash)).toBe(false);
  });
});
